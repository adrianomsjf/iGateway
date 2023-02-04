const ipt = require('./ipt')
const terminal = require('./terminal')

const tasks = []
let counter = 0

async function tick() {
   //process.stdout.write(`\r----- TICK ${(counter % 60)+1} -----------------------------------------------------------`)
   counter++
   for (const task of tasks) {
      if (!(counter % task.interval) && task.enabled()) {
         console.log(`${task.name}: `,await task.execute())
      }
   }
}

function init() {
   // Busca configurações no IPT, serve como parametro para ON-OFF do IPT
   tasks.push({
      interval : 5,
      name : 'CHECK-IPT',
      execute : ipt.checkIpt,
      enabled : ()=>true
   })


   // Somento IPT ON-LINE

   // Sync pedestres IPT
   tasks.push({
      interval : 5,
      name : 'SYNC-PEDESTRES-IPT',
      execute : ipt.syncPedestrians,
      enabled : ()=>global.IPT_ESTADO=='ON-LINE'
   })
   
   tasks.push({
      interval : 10,
      name : 'CHECK-TERMINAL',
      execute : terminal.checkTerminal,
      enabled : ()=>true
   })

   // Somento Terminal ON-LINE

   // Sync users Terminal
   tasks.push({
      interval : 10,
      name : 'SYNC-USUARIOS-TERMINAL',
      execute : terminal.syncUsers,
      enabled : ()=>global.TERMINAL_ESTADO=='ON-LINE' && global.NEED_SYNC_USERS
   })
   
   setInterval(tick,1000)
}

module.exports = { tasks, init }