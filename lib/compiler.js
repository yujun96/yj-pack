const fs = require('fs')
const path = require('path')
const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const generate = require('@babel/generator').default
const ejs = require('ejs')
const {SyncHook}  = require('tapable')
class Compiler {
    constructor(config) {
       this.config = config 
       this.entry = config.entry
       this.root = process.cwd()
       this.analyseObj = {}
       this.rules = config.module.rules


       this.hooks = {
        //    生命周期的定义
        compile: new SyncHook(),
        afterCompile: new SyncHook(),
        emit: new SyncHook(),
        afterEmit: new SyncHook(),
        done: new SyncHook()
       }
       // plugins数组中所有插件对象,调用apply方法，相当于注册事件
       if(Array.isArray(this.config.plugins)){
        this.config.plugins.forEach(plugin => {
            plugin.apply(this)
        })
       }
    }
    start() {
        // 开始编译了
        this.hooks.compile.call()
        //  开始打包
        //  依赖分析
        let originPath = this.getOriginPath(this.root,this.entry)
        this.depAnalyse(originPath)
        // 编译完成了
        this.hooks.afterCompile.call()
        // 开始发射文件了
        this.hooks.emit.call()
        this.emitFile()
        this.hooks.afterEmit.call()
        this.hooks.done.call()
    }
    emitFile() {
        let template= this.readFile(path.join(__dirname,'../template/output.ejs'))
        let result =  ejs.render(template,{
            entry: this.entry,
            modules: this.analyseObj
        })
        let outputPath = path.join(this.config.output.path,this.config.output.filename)
        fs.writeFileSync(outputPath,result)
        // console.log(result)
    }
    getOriginPath(path1,path2) {
        return path.resolve(path1,path2)
    }
    depAnalyse(modulePath){
        // 读取模块的内容
      let content =  this.readFile(modulePath)

    //   这一块是处理loader的内容 ----start  
    //  可以自己抽成一个函数
    //   读取rules的规则
    for(var i = this.rules.length-1;i>=0;i--){
        // this.rules[i]  
        let {test,use} = this.rules[i]
        //  匹配是否符合规则
        if(test.test(modulePath)){
            if(Array.isArray(use)){
                 // 这里要判断数字，对象，字符

                //   这儿可以封装一下，这里面没有封装
            for( var j=use.length-1;j>=0;j--){
                let loader =  require(path.join(this.root,use[j])) 
                content = loader(content)
              }
            }else if(typeof use === 'string') {
                let loader =  require(path.join(this.root,use)) 
                content = loader(content)
            }else if(use instanceof Object){
                // console.log(use.options)
                // console.log("现在use是第一项")
                let loader =  require(path.join(this.root,use.loader)) 
                content = loader.call({query:use.options},content)
            }
           
        } 
    }
    //   这一块是处理loader的内容 ----  end

     // 用于存取当前模块的所有依赖。便于后面遍历
      let dependencies = []
      // 将代码转化为ast语法树    
      const ast = parser.parse(content) 
      traverse(ast, {
          CallExpression(p) {
            if(p.node.callee.name === 'require') {
                p.node.callee.name = '__webpack_require__'
                let oldValue = p.node.arguments[0].value
                p.node.arguments[0].value = './'+ path.join('src',oldValue).replace(/\\+/g,'/')
                dependencies.push(p.node.arguments[0].value)
            }
          }
      })
     // 将ast语法树转化为代码
      let sourceCode =  generate(ast).code
     // 把当前的依赖，和文件内容推到对象里面去 
      let relavitePath = './'+ path.relative(this.root,modulePath).replace(/\\+/g,'/')
      this.analyseObj[relavitePath] = sourceCode
      dependencies.forEach(dep=>{
        //   递归一下
        this.depAnalyse(this.getOriginPath(this.root,dep))
      })
    }
    readFile(modulePath) {
        return fs.readFileSync(modulePath,'utf-8')
    }
}

module.exports = Compiler


