module.exports=error=>{
 console.error(error);
 if(process.env.GITHUB_ACTIONS){const message=String(error.stack||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');console.log(`::error::${message}`)}
 process.exit(1);
};
