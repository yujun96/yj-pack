// study 前端
//  准备学习资料   html css  js  react
const {SyncHook}  = require('tapable')

class Frontend{
    constructor() {
        this.hooks = {
           beforeStudy: new SyncHook(),
           afterHtml: new SyncHook(),
           afterCss: new SyncHook(),
           afterJs: new SyncHook(),
           afterReact: new SyncHook() 
        }
    }
    study() {
        console.log('开始准备学习')
        this.hooks.beforeStudy.call()
        console.log('开始准备学习html')
        this.hooks.afterHtml.call()
        console.log('开始准备学习css')
        this.hooks.afterCss.call()
        console.log('开始准备学习js')
        this.hooks.afterJs.call()
        console.log('开始准备学习react')
        this.hooks.afterReact.call()
    }
}


let f = new Frontend()
f.hooks.afterHtml.tap('afterHtml',()=>{
    console.log("学完html后我想造淘宝")
})

f.study()