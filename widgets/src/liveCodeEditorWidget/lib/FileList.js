import Path from "path";

/**
 * A file list to display the files of the repository of the component
 */

export default class FileList{

  constructor(codeEditor){
    this.codeEditor = codeEditor;
  }

  /**
   * A file object for this file list
   * @typedef {object}  FileList~File
   * @property {string}   type  - The type of the file. Either "file" or "folder"
   * @property {string}   path  - The absolute path of the file or folder
   * @property {string} [name]  - An optional name for the file or folder to display
   */

  /**
  *	Creates a new link for a file or folder
  *	@param {FileList~File} file - The {@link FileList~File} object
  *	@return {object}          - A new jquery element of the link for the file
  */

  createLink(file){
    let fileName = (file && file.name) || Path.basename(file.path);
    return $(`<a>${fileName}</a>`).click( () => {
      if (file.type == "folder") {
        this.codeEditor.loadFiles(file.path);
      }else if(true || fileName == "index.html" || fileName=="applicationScript.js"){
        this.codeEditor.open(file.path);
      }else{
        alert("Cannot open files without traces");
      }
    }).attr({
      "class" : "mdl-navigation__link",
      "href" : "javascript:void(0);"
    })
  }

  /**
  * Updates the file list with the new files
  * @param{FileList~File[]} files - The new {@link FileList-File} objects
  */

  setFiles(files){
    let links = files.map( file => this.createLink(file) );
    $("#files").html( links );
  }
}