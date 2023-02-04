const dotenv = require('dotenv')
dotenv.config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const ipt = require('./ipt')
const db = require('./db')
const processes =  require('./processes')
const terminal = require('./terminal')

const {IPT_HOST, IPT_PATH, CHAVE_ACESSO, CODTERMINAL} = process.env

//=============================================================================================
// Incialização
console.log('===========================================================================')
console.log('iGateway Versão 1.0.00')
console.log('')
console.log(`HOST: ${IPT_HOST}/${IPT_PATH}`)
console.log('Chave Acesso: ',CHAVE_ACESSO)
console.log('Cod. Terminal: ', CODTERMINAL)
console.log('===========================================================================')
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
            if (updated) {
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

   // Inicializa tarefas
   //processes.init()
   //console.log('Tarefas: Inicializadas')
   console.log('===========================================================================')
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

   const server = app.listen(8080,global.LOCAL_ADDRESS || null, function () {
      const host = server.address().address
      const port = server.address().port
      console.log("Servidor iGateway on-line em http://%s:%s", host, port);
      console.log('===========================================================================')
   });

   terminal.enableOnline()

   // Endpoint new user
// Answer for remote user authorization
var access_answer = {
   result: {
       event: 7, 
       user_name: 'John Doe',
       user_id: 1000,
       user_image: true, 
       portal_id: 1,
       actions: [
           {
               action: 'sec_box', 
               parameters: 'id=65793=1, reason=1' 
           }
       ],
       message:"Online access"
   }
};


app.post('/new_user_identified.fcgi', function (req, res) {
   console.log("endpoint: NEW USER IDENTIFIED");
   console.log("Data: ");
   console.log("Length: " + req.body.length);
   console.log(req.body);
   res.json(access_answer);
 })

/*
   app.all('/**', (request, response) => {
      //console.log('\n--- NEW REQUEST @ ' + moment().format('DD/MM/YYYY kk:mm:ss') + ' ---');
      console.log('Path -> ' + request.path);
      console.log('Query params -> ' + JSON.stringify(request.query));
      console.log('Content type -> ' + request.get('content-type'));
      console.log('Body length -> ' + request.get('content-length'));
      response.sendStatus(200)
    });
*/
}
init()
//=============================================================================================