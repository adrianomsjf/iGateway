const db = require('./db')
const { format } = require('date-fns')
const { scpf } = require('./lib')

async function recMarks(req,res) {
   await db.insertMark({
      CPF : scpf(req.body.user_id),
      MARCACAO : format(Date.now(), 'yyyy-MM-dd HH:mm:ss'),//Date.now(),
      REGISTRADA : false
   })
   res.json({
      result: {
         event: 7, 
         user_name: req.body.user_name,
         user_id: Number(req.body.user_id),
         user_image: false, 
         portal_id: 1,
         message:"Ponto Registrado"
      }
   })
}

module.exports = { recMarks }