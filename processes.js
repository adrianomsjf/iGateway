const {
   INTERVAL_CHECK_IPT, 
   INTERVAL_SYNC_PEDESTRES_IPT, 
   INTERVAL_SYNC_MARCACOES_IPT,
   INTERVAL_CHECK_TERMINAL,
   INTERVAL_SYNC_USUARIOS_TERMINAL
} = process.env
const ipt = require('./ipt')
const terminal = require('./terminal')
const marks = require('./marks')

const tasks = []
let counter = 0

async function tick() {
   //process.stdout.write(`\r----- TICK ${(counter % 60)+1} -----------------------------------------------------------`)
   counter++
   let haveProcess = false
   for (const task of tasks) {
      if (!(counter % task.interval) && task.enabled()) {
         haveProcess = true;
         console.log(`${task.name}: `,await task.execute())
      }
   }
   if (haveProcess) console.log('----------------------------------------')
}

function init() {
   // Busca configurações no IPT, serve como parametro para ON-OFF do IPT
   tasks.push({
      interval : INTERVAL_CHECK_IPT,
      name : 'CHECK-IPT',
      execute : ipt.checkIpt,
      enabled : ()=>true
   })


   // Somento IPT ON-LINE
   // Sync pedestres IPT
   tasks.push({
      interval : INTERVAL_SYNC_PEDESTRES_IPT,
      name : 'SYNC-PEDESTRES-IPT',
      execute : ipt.syncPedestrians,
      enabled : ()=>global.IPT_ESTADO=='ON-LINE'
   })
   
   // Somento IPT ON-LINE
   // Sync marcaocoes IPT
   tasks.push({
      interval : INTERVAL_SYNC_MARCACOES_IPT,
      name : 'SYNC-MARCACOES-IPT',
      execute : marks.syncMarks,
      enabled : ()=>global.IPT_ESTADO=='ON-LINE'
   })

   tasks.push({
      interval : INTERVAL_CHECK_TERMINAL,
      name : 'CHECK-TERMINAL',
      execute : terminal.checkTerminal,
      enabled : ()=>true
   })

   // Somento Terminal ON-LINE

   // Sync users Terminal
   tasks.push({
      interval : INTERVAL_SYNC_USUARIOS_TERMINAL,
      name : 'SYNC-USUARIOS-TERMINAL',
      execute : terminal.syncUsers,
      enabled : ()=>global.TERMINAL_ESTADO=='ON-LINE' && global.NEED_SYNC_USERS
   })
   
   setInterval(tick,1000)
}

module.exports = { tasks, init }