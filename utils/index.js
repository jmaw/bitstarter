var https   = require('https');
var async   = require('async');
var xdate   = require('xdate');

function CFControl(CFDate,CFAmount){
  this.cfdate = CFDate;
  this.cfamount = CFAmount;
  
  this.trans = [];
  this.balance = 0;
  this.days = 0;
  this.success = 0;
  this.warning = 0;
}


CFControl.prototype.Refresh = function(callback){
  var self = this;
  https.get("https://coinbase.com/api/v1/transactions?api_key=" + process.env.COINBASE_API_KEY, function(res) {
       var body = '';
       res.on('data', function(chunk) {body += chunk;});
       res.on('end', function() {
          try {
              var info = JSON.parse(body);  
              
// Backers calculations
  this.trans = [];   
  try{
	this.balance = parseFloat(info.balance.amount);
	for(var i=0;i<info.transactions.length;i++){
	   var t = info.transactions[i];
	   if (parseFloat(t.transaction.amount.amount) > 0){
	     try{
		  var idx = CFControl.prototype.BackerExists.call(this,t.transaction.sender.id);
		  if (idx == -1){
		      this.trans.push ({ userid:t.transaction.sender.id,
                                         name:t.transaction.sender.name,
                                         email:t.transaction.sender.email,
                                         amount:parseFloat(t.transaction.amount.amount) });						
		  }	
          else this.trans[idx].amount += parseFloat(t.transaction.amount.amount); 		  
	     }
         catch(e){
		   var idx = CFControl.prototype.BackerExists.call(this,t.transaction.recipient.id);
		   if (idx == -1){
		       this.trans.push ({ userid:t.transaction.recipient.id, 
                                          name:t.transaction.recipient.name, 
		                          email:t.transaction.recipient.email,
                                          amount:parseFloat(t.transaction.amount.amount) });						
		   }				
		   else this.trans[idx].amount += parseFloat(t.transaction.amount.amount); 		  

         }	   
	   }
	}
	
	this.trans.sort(function(a,b){
             return b.amount - a.amount;
          });

        // Date calculations	
         var now = new xdate();
         var next = new xdate(self.cfdate); 
         if (now.diffDays(self.cfdate) <= 0)
             this.days = 0;
         else
             this.days = Math.round(now.diffDays(self.cfdate));
	
	// Progress calculations
	
	this.success = Math.round(this.balance * 100 / self.cfamount);
        this.warning = 100 - this.success;

        callback(this);      
	
       }
       catch(e){
          console.log('calculation error: '+e.message);
       }   

             
          } catch (error) {
             console.log(error);
             response.send("error en cfcontrol");
          }

          

       });

       res.on('error', function(e) {
           console.log(e);
           response.send("error syncing backers");
       });

  });

  
}

CFControl.prototype.BackerExists = function(id){
  for (var i=0;i<this.trans.length;i++){
      if (this.trans[i].userid == id) return i;
  } 
  return -1;
}

if (!global.hasOwnProperty('cf')) {
   global.cf = new CFControl(process.env.DEADLINE,process.env.TOTAL_CROWDFUNDING);
}

module.exports = global.cf;
