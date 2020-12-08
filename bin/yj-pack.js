#! /usr/bin/env node 
// console.log('hello world1111')
const path = require('path') 
//  1. 读取需要打包项目的配置文件
let config = require(path.resolve('webpack.config.js'))
// let config  = require(process.cwd(),'webpack.config.js')

//   问题; __dirname的问题
//   路径问题    
//   path.resolve(__dirnamr)

// console.log(config)




const Compiler = require('../lib/compiler')
let a = new Compiler(config)
a.start()
// console.log(a.analyseObj)
