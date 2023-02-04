const axios = require('axios')
const db = require('./db.js')
const { ncpf } = require ('./lib.js')
const { TERMINAL_IP, TERMINAL_LOGIN, TERMINAL_SENHA } = process.env

async function login() {
   try {
      const ret = await axios.post(`http://${TERMINAL_IP}/login.fcgi`,{
         login: TERMINAL_LOGIN,
         password: TERMINAL_SENHA
      },{
         timeout: 5000
      })
      global.LOCAL_ADDRESS = ret.request.socket.localAddress
      if (ret.status==200) {
         global.TERMINAL_SESSION = ret.data.session
         return ret.data.session
      } else {
         console.log('Erro ao fazer login no Terminal[',ret.status, ret,statusText,']')
         return null
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return null
   }
}

async function getInfo() {
   try {
      const ret = await axios.post(`http://${TERMINAL_IP}/system_information.fcgi?session=${global.TERMINAL_SESSION}`,{
      },{
         timeout: 5000
      })
      if (ret.status==200) {
         return ret.data
      } else {
         console.log('Erro ao fazer login no Terminal[',ret.status, ret,statusText,']')
         return null
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return null
   }
}

async function init() {
   if (await login()) {
      const cfg = await getInfo()
      if (cfg) {
         return cfg.serial
      } else {
         return null
      }
   }
}

async function getUsers() {
   try {
      const ret = await axios.post(`http://${TERMINAL_IP}/load_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
         object: "users"
      },{
         timeout: 5000
      })
      if (ret.status==200) {
         return ret.data.users
      } else {
         console.log('Erro ao fazer login no Terminal[',ret.status, ret,statusText,']')
         return null
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return null
   }
}

async function addUsers(users) {
   try {
      const ret = await axios.post(`http://${TERMINAL_IP}/create_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
         object: "users",
         values: users
      },{
         timeout: 5000
      })
      if (ret.status==200) {
         return ret.data
      } else {
         console.log('Erro ao adicionar usuários no Terminal[',ret.status, ret,statusText,']')
         return null
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return null
   }
}

async function updateUsers(users) {
   try {
      for (const user of users) {
         const id = user.id
         delete user.id
         const ret = await axios.post(`http://${TERMINAL_IP}/modify_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
            object: "users",
            values: user,
            where: { users: { id } }
         },{
            timeout: 5000
         })
         if (ret.status!=200) {
            console.log('Erro atualizar usuários no Terminal[',ret.status, ret,statusText,']')
            return 
         }
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return 
   }
}

async function deleteUsers(users) {
   try {
      for (const user of users) {
         const ret = await axios.post(`http://${TERMINAL_IP}/destroy_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
            object: "users",
            where: { users: { id: user.id } }
         },{
            timeout: 5000
         })
         if (ret.status!=200) {
            console.log('Erro deletar usuários no Terminal[',ret.status, ret,statusText,']')
            return 
         }
      }
   } catch(err) {
      console.log('Erro ao acessar Terminal [',err.message,'-',err.config.url,']')
      return 
   }
}

async function syncUsers(users) {
   if (!users) {
      users = await getUsers()
   }
   const pedestrians = await db.getPedestrians()
   const toUpdate = []
   const toAdd = []
   pedestrians.forEach(pedestrian => {
      const ncpfPedestrian = ncpf(pedestrian.CPF)
      const userIdx = users.findIndex(user => user.id == ncpfPedestrian)
      if (userIdx>=0) {
         toUpdate.push({
            id : ncpfPedestrian,
            registration : pedestrian.CRACHA.replace(/^0+/, ''),
            name : pedestrian.NOME,
            password: pedestrian.SENHA
         })
         users.splice(userIdx,1)
      } else {
         toAdd.push({
            id : ncpfPedestrian,
            registration : pedestrian.CRACHA.replace(/^0+/, ''),
            name : pedestrian.NOME,
            password: pedestrian.SENHA
         })
      }
   });
   if (toUpdate.length) updateUsers(toUpdate)
   if (toAdd.length) addUsers(toAdd)
   if (users.length) deleteUsers(users)
   global.NEED_SYNC_USERS=false
   return {
      updated : toUpdate.length,
      added : toAdd.length,
      deleted : users.length
   }
}

async function checkTerminal() {
   const ret = await getInfo()
      if (ret) {
      global.TERMINAL_ESTADO = 'ON-LINE'
   } else {
      global.TERMINAL_ESTADO = 'OFF-LINE'
   }
   return global.TERMINAL_ESTADO
}

async function enableOnline() {
   try {
      const ret1 = await axios.post(`http://${TERMINAL_IP}/destroy_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
         object: "devices",
         where: {
             devices: { id: 8080 }
         }
      });
      console.log("destroyOnlineObject success: ", ret1.data);
      const ret2 = await axios.post(`http://${TERMINAL_IP}/create_objects.fcgi?session=${global.TERMINAL_SESSION}`,{
         object: "devices",
         values: [
            {
               id : 8080,
               name: "iGateway",
               ip: global.LOCAL_ADDRESS+":8080",
               public_key: ""
            }
         ]
      });
      console.log("createOnlineObject success: ", ret2.data);
      const ret3 = await axios.post(`http://${TERMINAL_IP}/set_configuration.fcgi?session=${global.TERMINAL_SESSION}`,{
         online_client: {
            server_id: "8080"
         }
      });
      console.log("setOnline success: ", ret3.data);
      
   } catch (error) {
       console.log("Error performing createOnlineObject: ", error.data);
   }
}


module.exports = { init, login, getInfo, getUsers, syncUsers, checkTerminal, enableOnline }