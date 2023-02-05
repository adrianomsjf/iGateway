function ncpf(cpf) {
   return Number(cpf.replaceAll('.','').replace('-',''))
}

function scpf(cpf) {
   const s = cpf.toString()
   return s.substr(0,3)+'.'+s.substr(3,3)+'.'+s.substr(6,3)+'-'+s.substr(9,2)
}

module.exports = { ncpf, scpf }