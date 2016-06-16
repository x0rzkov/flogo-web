import Pouchdb from 'pouchdb';
import path from 'path';
import npm from 'npm';
import _ from 'lodash';
import fs from 'fs';
import {DBService} from '../../common/db.service';
import {isDirectory, isExisted, readDirectoriesSync} from '../../common/utils';
import {config} from '../../config/app-config';
import { DEFAULT_SCHEMA_ROOT_FOLDER_NAME } from '../../common/constants';

const execSync = require('child_process').execSync;

const COMPONENT_TYPE = ["trigger", "activity", "model"];


// default options
const defaultOptions = {
  path: 'modules/base-registered',
  jsonTplName: 'package.tpl.json'
};

/**
 * Base class of registered
 */
export class BaseRegistered{
  /**
   * constructor function
   * @param {string||DBService} dbName - db name or an instance of DBService. it can be local or remote db
   * @param {Object} options
   * @param {Object} options.type - currently registered type, it can be trigger, activity, model
   * @param {string} options.defaultPath - the default path that store activity or trigger or model develop by Flogo team
   * @param {Object} [options.defaultConfig] - by default, we will install it from local file system, but you can use this to overwrite. {'folder_name': 'path'}
   * @param {string} options.customPath - the custom path that store activity or trigger or model develop by contributor
   * @param {Object} [options.customConfig] - by default, we will install it from local file system, but you can use this to overwrite. {'folder_name': 'path'}
   * @param {string} [options.path='modules/base-registered'] - path relative to root folder.
   * @param {string} [options.jsonTplName='package.tpl.json'] - package.json template file name.
   * @param {string} options.schemaJsonName - The name of schema json
   */
  constructor(dbName, options){

    if(!dbName){
      throw "dbName is required";
    }

    this._options = _.merge({}, defaultOptions, options);

    // store db information
    if(_.isString(dbName)){
      this._dbService = new DBService(dbName);
    }else if(_.isObject(dbName)&&(dbName instanceof DBService)){
      this._dbService = dbName;
    }else{
      throw "dbName is required, and it should be a name of DB or an instance of DBService";
    }

    // folder store package.json
    this._packageJSONFolderPath = path.resolve(config.rootPath, this._options.path);
    // package.tpl.json path
    this._packageJSONTplFilePath = path.join(this._packageJSONFolderPath, this._options.jsonTplName);

    // read the package.json template, will use this template to generate package.json
    let data = fs.readFileSync(this._packageJSONTplFilePath, {"encoding": "utf8"});
    this.packageJSONTemplate = JSON.parse(data);

    // store the path of RT(activity RT, trigger RT)
    this._where = [];
  }

  register(){
    return new Promise((resolve, reject)=>{
      this.clean().then(()=>{
        console.log("[Info]clean success!, type: ", this._options.type);
        this.updateDB().then(()=>{
          resolve(true);
        }).catch((err)=>{
          reject(err);
        });
      }).catch((err)=>{
        console.error("[Error]clean fail!, type: ", this._options.type);
        reject(err);
      });
    });
  }

  get dbService(){
    return this._dbService;
  }

  static generateID(name, version){
    // console.log("generateActivityID, arguments: ", arguments);
    name = _.kebabCase(name);
    // console.log("name: ", name);
    // TODO need to think about how to versionable activity
    version = _.kebabCase(version);
    // console.log("version: ", version);
    // let id = this.ACTIVITIES+this.DELIMITER+name+this.DELIMITER+version;
    let id = name;
    //console.log("generateID, id: ", id);
    return id;
  }

  static constructItem( opts ) {
    return {
      _id : opts.id,
      'where' : opts.where,
      'name' : opts.name,
      'version' : opts.version,
      'description' : opts.description,
      'keywords' : opts.keywords || [],
      'schema' : opts.schema
    }
  }

  static saveItems( dbService, items, updateOnly ) {
    let _items = _.cloneDeep( items ); // in order to avoid the changes on the given items.

    // get all of the items in the given db
    return dbService.db.allDocs( { include_docs : true } )
      .then( ( docs )=> {
        console.log( '[info] Get all items.' );
        return docs
      } )
      // pre-process the docs
      .then( ( docs ) => {
        console.log( '[info] pre-process the docs' );
        return _.map( docs.rows, ( row ) => {
          return (row && row.doc) || null;
        } );
      } )
      .then( ( itemDocs ) => {
        return _.filter( itemDocs, itemDoc => !_.isNull( itemDoc ) );
      } )

      // update or remove item
      // `updateOnly` will skip the `remove other items` part.
      .then( ( oldItems ) => {

        console.log( '[info] update or remove item' );

        return Promise.all( _.map( oldItems, ( oldItem ) => {

          let newItem = _items[ oldItem[ '_id' ] ];

          // if this item cannot be found in the activityDocs generated from package.json, then need to be removed
          if ( !newItem ) {
            if ( updateOnly ) {
              console.log( `[info] ignore exist item [${oldItem[ 'where' ]}] for updating only.` );
              return null;
            }
            return dbService.db.remove( oldItem )
              .then( ( result ) => {
                console.log( `[info] delete item [${oldItem[ 'where' ]}] success.` );
                return result;
              } )
              .catch( ( err )=> {
                console.error( "[error] delete item fail.", err );
                throw err;
              } );
          } else {
            // update the item.

            // When updating an item, the old one will be overwritten,
            // since the user maybe delete some value in the new one.

            // copy the some value from current activity in DB
            newItem[ '_id' ] = oldItem[ '_id' ];
            newItem[ '_rev' ] = oldItem[ '_rev' ];
            newItem.created_at = oldItem.created_at;
            newItem.updated_at = new Date().toISOString();

            // update this item in DB
            return dbService.db.put( _.cloneDeep( newItem ) )
              .then( ( response )=> {
                console.log( `[info] Update item [${newItem[ 'where' ]}] success.` );
                return response;
              } )
              .then( ( result ) => {
                // delete this item from the given list.
                delete _items[ oldItem[ '_id' ] ];
                return result;
              } )
              .catch( ( err )=> {
                console.log( `[error] Update item [${newItem[ 'where' ]}] error: `, err );
                throw err;
              } );
          }
        } ) );

      } )
      // filter undefined && null
      .then( ()=> _.filter( _items, _item => !_.isNil( _items ) ) )

      // add new items
      .then( ( newItems )=> {
        console.log( '[info] add new items' );

        return Promise.all( _.map( newItems, ( newItem ) => {
          newItem.created_at = new Date().toISOString();

          return dbService.db.put( newItem )
            .then( ( response )=> {
              console.log( `[info] Add item [${newItem[ 'where' ]}] success.` );
              return response;
            } )
            .catch( ( err )=> {
              console.log( `[error] Add item [${newItem[ 'where' ]}] error: `, err );
              throw err;
            } );
        } ) );
      } )

      // done with true
      .then( () => true )
      .catch( ( err ) => {
        console.error( `Error in saveItems:\n${ err }` );
        throw err;
      } );
  }

  // watch the activities
  watch(){
    this.updateActivitiesDB();
    // continue watch and also watch te sbudirectories
    let watchOptions = {
      persistent: true,
      recursive: true
    };

    // start watch the change in activities folder
    fs.watch(this.activitiesAbsolutePath, watchOptions, (event, filename)=>{
      // console.log("========event: ", event);
      // console.log("========filename: ", filename);
      this.updateActivitiesDB();
    });
  }

  clean(){
    //console.log("-------clean");
    return new Promise((resolve, reject)=>{
      this.cleanDB()
        .then((result)=>{
          return this.cleanNodeModules();
        })
        .then((result)=>{
          resolve(true);
        })
        .catch((err)=>{
          reject(false);
        });
    });
  }

  cleanDB(){
    return new Promise((resolve, reject)=>{
      this._dbService.db.allDocs({include_docs: true}).then((result)=>{
        console.log("[info]cleanDB, type: ", this._options.type);
        let docs = result&&result.rows||[];
        let deletedDocs = [];

        if(docs.length === 0){
          console.log("[success]cleanDB finished!, empty docs type: ", this._options.type);
          resolve(result);
        }

        docs.forEach((item)=>{
          //doc._deleted = true;
          let doc = item&&item.doc;
          if(doc){
            doc._deleted = true;
            deletedDocs.push(doc);
          }
          //console.log(doc);
        });

        //console.log(deletedDocs);
        this._dbService.db.bulkDocs(deletedDocs).then((result)=>{
          console.log("[success]cleanDB finished!, type: ", this._options.type);
          resolve(result);
        }).catch((err)=>{
          reject(err);
          console.error("[error]cleanDB error!, update docs error! type: ", this._options.type, err);
        });

      }).catch((err)=>{
        console.error("[error]cleanDB error!, get docs error! type: ", this._options.type, err);
        reject(err);
      });
    });
  }

  cleanNodeModules(){
    return new Promise((resolve, reject)=>{
      try {
        let nodeModulesPath = path.join(this._packageJSONFolderPath, 'node_modules');
        if(isExisted(nodeModulesPath)){
          execSync(`rm -rf ${nodeModulesPath}`);
        }
        console.log("[Success]cleanNodeModules finished!, type: ", this._options.type);
        resolve(true);
      }catch (err){
        console.error("[error]cleanNodeModules error!, type: ", this._options.type);
        reject(false);
      }
    });
  }

  /**
   *
   */
  updatePackageJSON(dirPath, config, sourcePackageJSON){
    console.log("[debug]updatePackageJSON");
    let packageJSON = _.cloneDeep(sourcePackageJSON);
    !packageJSON.dependencies ? (packageJSON.dependencies = {}): null;
    // get all the activity package in activitiesPath
    if(dirPath){
      let dirs = readDirectoriesSync(dirPath);
      //console.log(dirs);
      if(dirs&&dirs.length){
        // console.log("???????dirs", dirs);
        dirs.forEach((dir, index)=>{
          let itemPath = path.join(dirPath, dir);
          //console.log("itemPath: ", itemPath);

          let design_package_json=null;
          let value = null;

          // TODO need to improve, provide more good way

          if(isExisted(path.join(itemPath, DEFAULT_SCHEMA_ROOT_FOLDER_NAME, 'package.json'))){
            design_package_json = path.join(itemPath, DEFAULT_SCHEMA_ROOT_FOLDER_NAME, 'package.json');
            value = path.join(itemPath, DEFAULT_SCHEMA_ROOT_FOLDER_NAME);
          }else if(isExisted(path.join(itemPath, 'src', DEFAULT_SCHEMA_ROOT_FOLDER_NAME, 'package.json'))){
            design_package_json = path.join(itemPath, 'src', DEFAULT_SCHEMA_ROOT_FOLDER_NAME, 'package.json');
            value = path.join(itemPath, 'src', DEFAULT_SCHEMA_ROOT_FOLDER_NAME);
          }else{
            console.log("[Warning] didn't find design time for this activity");
          }

          if(design_package_json){
            let data = fs.readFileSync(design_package_json, {"encoding": "utf8"});
            let designPackageJSONData = JSON.parse(data);
            let type = designPackageJSONData.name;
            if(type){
              packageJSON.dependencies[type] = path.join(value);
              let where = config[type]&&config[type].path? config[type].path: "file://"+itemPath;
              this._where[type] = where;
            }
          }

        });
        // console.log("++++++packageJSON: ", packageJSON);
      }else{
        //console.log("[info]updatePackageJSON. empty");
      }

      let JSONStr = JSON.stringify(packageJSON, null, 2);
      fs.writeFileSync(path.join(this._packageJSONFolderPath, 'package.json').toString(), JSONStr, {"encoding": "utf8"});
    }

    return packageJSON;
  }

  updateDB(){
    return new Promise((resolve, reject)=>{
      console.log("[debug]updateDB");
      // update activity package.json
      let packageJSON = _.cloneDeep(this.packageJSONTemplate);
      packageJSON = this.updatePackageJSON(this._options.defaultPath, this._options.defaultConfig, packageJSON);
      packageJSON = this.updatePackageJSON(this._options.customPath, this._options.customConfig, packageJSON);
      // console.log(packageJSON);
      let dependencies = packageJSON.dependencies;
      // new activities generate from package.json
      let items = {};

      // install all activity packages
      this.install().then(()=>{

        // generate all the activity docs
        _.forOwn(dependencies, (value, key)=>{
          let packageJSON = JSON.parse(fs.readFileSync(path.join(this._packageJSONFolderPath, 'node_modules', key, 'package.json'), 'utf8'));
          let schemaJSON = JSON.parse(fs.readFileSync(path.join(this._packageJSONFolderPath, 'node_modules', key, this._options.schemaJsonName), 'utf8'));
          // console.log("packageJSON: ", packageJSON);
          // console.log("schemaJSON: ", schemaJSON);

          let id = BaseRegistered.generateID(key, packageJSON.version);
          console.log("id: ", id);

          items[ id ] = BaseRegistered.constructItem( {
            'id' : id,
            'where' : this._where[ key ],
            'name' : key,
            'version' : packageJSON.version,
            'description' : packageJSON.description,
            'keywords' : packageJSON.keywords || [],
            'schema' : schemaJSON
          } );
        });

        // console.log("!!!!!!!!activityDocs: ", activityDocs);

        BaseRegistered.saveItems( this.dbService, items )
          .then( ( result ) => {
            console.log( `[info] updateDB done.` );
            return result;
          })
          .then( resolve )
          .catch( reject );

      }).catch((err)=>{
        console.error("[error]Install error. ", err);
        reject(err);
      });
    });
  }

  /**
   * @callback npmLoadCallback
   * @params {Object} err - If has error, will pass error object back
   */
  /**
   * npm.load() must be called before any other function call. Create a common function for this
   * @param {npmLoadCallback} callback
   */
  npmLoad(callback){
    npm.load({}, function(err){
      if(err) throw new Error(err);
      callback();
    });
  }

  install(){
    return new Promise((resolve, reject)=>{
      this.npmLoad(()=>{
        // Store current working directory
        var currentCWD = process.cwd();
        console.log("currentCWD: ", currentCWD);
        process.chdir(this._packageJSONFolderPath);
        npm.commands.install(this._packageJSONFolderPath, [], (err, result)=>{
          // Change current working directory back
          process.chdir(currentCWD);
          if(err){
            reject(err);
            console.log(err);
          }else{
            resolve(result);
            //console.log("success: ", result);
          }
        });
      });
    });
  }
}
