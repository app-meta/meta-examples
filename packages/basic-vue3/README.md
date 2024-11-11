# Vue3+NaiveUI通用组件库

## 事件监听

程序集成`mitt`进行事件监听/发布，示例：

```javascript
const handler = params=> console.debug(`事件触发`, params)

//绑定事件处理函数
E.on(`event-name`, ()=>handler)
//发布事件，并传递参数
E.emit(`event-name`, 1)
//移除事件监听函数
E.off(`even-name`, handler)
```

### 自带的事件

事件名|作用范围|参数|说明
-|-|-|-
jumpTo|Main.vue|nameOrRoute|跳转到指定路由|
menus|Main.vue|menuItems|刷新主界面的顶部菜单项
padding|Window.vue|边距值|设置 body 的内边距（单位 px）