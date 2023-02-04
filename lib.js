function ncpf(cpf) {
   return Number(cpf.replaceAll('.','').replace('-',''))
}

module.exports = { ncpf }