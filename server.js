const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const ipt = require('./ipt')
const db = require('./db')
const processes =  require('./processes')
const terminal = require('./terminal')
const marks = require('./marks')

const {IPT_HOST, IPT_PATH, CHAVE_ACESSO, CODTERMINAL} = process.env

//=============================================================================================
// Incialização
console.log('==================================================================================')
console.log('iGateway Versão 1.0.00')
console.log('')
console.log(`HOST: ${IPT_HOST}/${IPT_PATH}`)
console.log('Chave Acesso: ',CHAVE_ACESSO)
console.log('Cod. Terminal: ', CODTERMINAL)
console.log('==================================================================================')
console.log('Inicializando...')

async function init() {
   // Incializa DB
   process.stdout.write('Banco de dados: ')
   console.log(await db.init())

   // Incializa IPT
   process.stdout.write('Servidor IPT: ')
   if (await ipt.getCfg()) {
      console.log('ON-LINE')
      global.IPT_ESTADO = 'ON-LINE'
   } else {
      console.log('Servidor IPT: OFF-LINE')
      global.IPT_ESTADO = 'OFF-LINE'
   }

   // Incializa Terminal
   process.stdout.write('Terminal: ')
   const nsTerminal = await terminal.init()
   if (nsTerminal) {
      console.log(nsTerminal,' ON-LINE')
      global.TERMINAL_ESTADO = 'ON-LINE'
   } else {
      console.log('Terminal: OFF-LINE')
      global.TERMINAL_ESTADO = 'OFF-LINE'
   }

   // Incializa Pedestres Servidor IPT
   if (global.IPT_ESTADO=='ON-LINE') {
      process.stdout.write('Pedestres no Servidor IPT: ')
      console.log(`${await ipt.syncPedestrians()} Lidos e Gravados no BD`)
   

      // Incializa Pedestres Terminal
      if (global.TERMINAL_ESTADO=='ON-LINE') {
         process.stdout.write('Pedestres no Terminal: ')
         const users = await terminal.getUsers()
         if (users) {
            console.log(`${users.length} Lidos`)

            // Sincroniza Pedestres Terminal
            process.stdout.write('Sincronizando Pedestres no Terminal: ')
            const {updated, added, deleted} = (await terminal.syncUsers(users)) || {}
            if (updated>=0) {
               console.log(
                  `${updated} Atualizados |`,
                  `${added} Adicionados |`,
                  `${deleted} Deletados`)
            } else {
               console.log('Sincronizando Pedestres no Terminal: FALHA')
               console.log('Terminal: OFF-LINE')
               global.TERMINAL_ESTADO = 'OFF-LINE'
            }

         } else {
            console.log('Terminal: OFF-LINE')
            global.TERMINAL_ESTADO = 'OFF-LINE'
         }
      }
   
   }

   console.log('==================================================================================')
   console.log('Inicilizando Servidor iGateway')
   
   // Configurations
   const options = {
      inflate: true,
      limit: '2mb',
      type: 'application/octet-stream'
   };   
   app.use(bodyParser.raw(options));
   app.use(bodyParser.json({ limit: '5mb' }));
   app.use(bodyParser.urlencoded({ extended: false }));
   app.use(bodyParser.text());

   app.post('/new_user_identified.fcgi', marks.recMarks)

   app.get('/', function(req, res, next) {
      var html = fs.readFileSync('./html/home.html', 'utf8')
      //res.render('home', { html: html })
      res.send(html)
   })

   const server = app.listen(8000,global.LOCAL_ADDRESS || null)
   // Aguarda servidor subir
   await { then(r, f) { server.on('listening', r); server.on('error', f); } }
   const host = server.address().address
   const port = server.address().port
   console.log("Servidor iGateway on-line em http://%s:%s", host, port);
   
   
   console.log('==================================================================================')
   console.log('Configurando Terminal')
   await terminal.setTime()
   await terminal.cfgTerminal()


   console.log('==================================================================================')
   console.log('Iniciando Tarefas...')
   processes.init()
   console.log('Tarefas: Inicializadas')

}
init()
//=============================================================================================