const md5 = require('md5')
const { format } = require('date-fns')

function ncpf(cpf) {
   return Number(cpf.replaceAll('.','').replace('-',''))
}

function scpf(cpf) {
   const s = cpf.toString()
   return s.substr(0,3)+'.'+s.substr(3,3)+'.'+s.substr(6,3)+'-'+s.substr(9,2)
}

function calcHash( cpf, marcacao ){
   const myHash = global.TERMINAL_NS + cpf.toString() + format(marcacao, 'yyyyMMddHHmmss');
   return (md5(myHash))
}

module.exports = { ncpf, scpf, calcHash }