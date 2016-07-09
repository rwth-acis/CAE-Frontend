let CONFIG = {

  NS: {
    PERSON : {
      TITLE: "http://purl.org/dc/terms/title",
      JABBERID: "http://xmlns.com/foaf/0.1/jabberID",
      MBOX: "http://xmlns.com/foaf/0.1/mbox"
    },
    MY:{
      MODEL: "my:ns:model"
    }
  }
}

const jabberId = 12345;

export default {
  ns:{
    role : "role"
  },
  oo:{
    Resource:function(){
      return {
        getSubResources:function(opt){
          opt.onAll([{
            getRepresentation:function(type, callback){
              callback({
                attributes:{
                  label:{
                    value:{
                      value:"JustARandomValue1223nvdfbvh9"
                    }
                  }
                }
              });
            }
          }]);
        },
        create:function(opt){
          console.log(opt.type,opt.representation);
          opt.callback();
        }
      }
    }
  },
  param:{
    space:function(){return "space"},
    user:function(){return "user"}
  },
  resource:{
    get:function(param,callback){
      switch (param) {
        case "space":
        let subject ={};
        subject[CONFIG.NS.PERSON.TITLE]=[{value:"Dummy Space Title"}];
        callback({
          data:{
            subject:subject
          },
          subject:subject
        });
        break;
        case "user":
        let data = {};
        data["uri"]={};
        data["uri"][CONFIG.NS.PERSON.TITLE]=[{value:"User Title"}];
        data["uri"][CONFIG.NS.PERSON.JABBERID]=[{value:`xmpp:u${jabberId}`}];
        callback({
          uri:"uri",
          data:data
        });
        break;
      }
      callback({data:{user:"user"}});
    }
  }
}
