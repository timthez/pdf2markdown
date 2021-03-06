/**
 * @namespace DM
 */
var SQL = require('sql.js');
var Sequelize = require('sequelize');
var fs = require("fs");
const FILE = "resources/db.sqlite";


/**
 * @memberof DM
 */
class DB {
  /**
   * Checks whether database storage exists
   * @return {DB} {@link DB}
   */
  constructor() {
    try{
      //Check if already exists
      var filebuffer = fs.readFileSync(FILE);
      var db = new SQL.Database(filebuffer);
      db.close();
    }catch(e){
      //Create if doesnt exist
      var db = new SQL.Database();
      var data = db.export();
      var buffer = new Buffer(data);
      fs.writeFileSync(FILE, buffer);
      db.close();
    }
  }
  
  /**
   * Setup Models
   * @return {undefined} 
   */
  _models(){
    this.Document = this.db.define("document",require('./models/document.js'));
    this.Page = this.db.define("page",require('./models/page.js'));
    this.Font = this.db.define("font", require('./models/font.js'));
    this.Character = this.db.define("character",require('./models/character.js'));
    this.Line = this.db.define("line", require('./models/line.js'));
    this.Rectangle = this.db.define("rectangle", require('./models/rectangle.js'));
    this.Image = this.db.define("image", require('./models/image.js'));
    this.ImageData = this.db.define("imagedata", require('./models/image_data.js'));
    this.Annotation = this.db.define("annotation", require('./models/annotation.js'));
  }
  
  /**
   * Setup Associations
   * {@link Document} has many {@link Page Pages}
   * @return {undefined} 
   */
  _associations(){  
    // Document -> Page
    this.Page.belongsTo(this.Document);
    this.Document.hasMany(this.Page);    
    
    // Page -> Character
    this.Character.belongsTo(this.Page);
    this.Page.hasMany(this.Character);
    
    // Character -> Font
    this.Character.belongsTo(this.Font,{
      constraints: false
    });
    this.Font.hasMany(this.Character,{
      constraints: false
    });
    
    // Document -> Font
    this.Font.belongsTo(this.Document);
    this.Document.hasMany(this.Font);
    
    // Page -> Line
    this.Line.belongsTo(this.Page);
    this.Page.hasMany(this.Line);
    
    // Page -> Rectangle
    this.Rectangle.belongsTo(this.Page);
    this.Page.hasMany(this.Rectangle);
    
    // Page -> Image
    this.Image.belongsTo(this.Page,{
      constraints: false
    });
    this.Page.hasMany(this.Image,{
      constraints: false
    });
    
    // ImageData -> Image
    this.Image.belongsTo(this.ImageData);
    this.ImageData.hasMany(this.Image);
    
    // Page -> Annotation
    this.Annotation.belongsTo(this.Page);
    this.Page.hasMany(this.Annotation);
            
  } 
  
  /**
   * Loads the database
   * Cant happen in constructor as ```this.db.sync()``` is asynchronous
   * 
   * @param  {Boolean} wipe - wipes the database and recreates
   * @return {async}  async - Returns when db has been loaded
   */
  async load(wipe=true,logging=false,postgres=true){
    //Setup DB
    
    if(postgres){
      this.db = new Sequelize('pdfmarkdown','postgres','postgres',{
        logging: logging ? (e)=>{fs.appendFile("resources/log.log",e+"\n",()=>{});} : false,
        dialect: 'postgres',
        host: 'localhost',
        port: 5433,
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        },
      });
    }else{
      this.db = new Sequelize(undefined,undefined,undefined,{
        logging: logging ? (e)=>{fs.appendFile("resources/log.log",e+"\n",()=>{});} : false,
        storage: FILE,
        dialect: 'sqlite'
      });
    }
    this._models();
    this._associations();
    
    //Sync db, use force: true to recreate tables
    await this.db.sync({
      force: wipe,
      logging: logging ? (e)=>{fs.appendFile("resources/log.log",e+"\n")} : false
    },()=>{});
  }
  queue(prom){
    
  }
}


module.exports = DB;