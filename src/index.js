'use strict';
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({strapi}) {
    let {Server} = require('socket.io')
    let io = new Server(strapi.server.httpServer,{
      cors:{
        origin:"http://127.0.0.1:5500", // Port of VsCode's LiverServer Your's can differ
        methods:['GET','POST'],
        allowedHeaders:["my-custom-header"],
        credentials:true
      }
    })
    io.on('connection', (socket) => {
      try {
      socket.on('chat message', async (msg) => {
        var axios = require("axios");
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI('API_KEY');
        async function run(query) {
          // For text-only input, use the gemini-pro model
          const model = genAI.getGenerativeModel({ model: "gemini-pro"});
          const result = await model.generateContent(query);
          const response = await result.response;
          const text = response.text();
          return text
        }
        let resp = await run(msg)
        let data = JSON.stringify({
          "data": {
            "message": msg,
            "ai_response":resp
          }
        });
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'http://127.0.0.1:1337/api/messages',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer 5a54882e89c3a722bd7b17ca716626edfd2929b207a8cd4358c3c581d3337ecd8026526d1d0f3f81406df2bb41c0c888b3dea6dd6d56539c81ca3245c38f4a7fe8f2fad22d6da2ac15f201d171421ddb80aadf1a64f9213dffb6c13ba013db17dd3ba670e06893950b63713ac3d0656cb430facb662c84af7884900c6d94b00d'
          },
          data : data
        };
        let final_response = {
          'status':true,
          msg:msg,
          is_good_to_insert:true,
          'ai_response':resp
        }
        axios.request(config)
        .then((response) => {
          console.log(JSON.stringify(response.data));
          io.emit('chat message', final_response);
        })
        .catch((error) => {
          console.log(error);
        });
        
      });
      } catch (error) {
        console.log("Something Went Wrong");
      }
    });
  },
};
