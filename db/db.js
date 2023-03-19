const db = require('mongoose')

db.set('strictQuery', true);
main().catch(err => console.log(err))

async function main(){
    await db.connect(`mongodb+srv://admin:admin@cluster0.okchj3m.mongodb.net/?retryWrites=true&w=majority`)
}

main();

module.exports = db;
