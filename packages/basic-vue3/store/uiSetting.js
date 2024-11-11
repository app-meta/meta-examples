/*
 * @Author: 0604hx/集成显卡
 * @Date: 2022-03-26 21:58:12
 * @Last Modified by: 集成显卡
 * @Last Modified time: 2023-04-12 18:48:29
 *
 * UI 相关配置
 */
import { defineStore } from 'pinia'

let detectTheme = v =>{
    let theme = v || (localStorage.getItem("ui.theme")|| "auto")
    let _dark = theme==='dark'
    if(!_dark && theme==='auto'){
        let hour = new Date().getHours()
        _dark = hour >= 18 || hour<=8
    }
    return _dark?"dark":"light"
}

export const useUISetting = defineStore('ui', {
    state: () => ({
        theme: detectTheme(),           // light，dark，auto（自动）
        darkNav: localStorage.getItem("ui.darkNav") !== "false"
    }),
    getters: {
        getTheme() {
            return this.theme
        },
        getDarkNav() {
            return this.darkNav
        }
    },
    actions: {
        updateTheme(theme) {
            this.theme = detectTheme(theme)
            localStorage.setItem("ui.theme", theme)
        },
        updateDarkNav (v){
            this.darkNav = v
            localStorage.setItem("ui.darkNav", v)
        }
    }
})
