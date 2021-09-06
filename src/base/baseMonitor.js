import utils from '../utils/util'
import DeviceInfo from '../device'
import TaskQueue from './taskQueue'
import { ErrorLevelEnum, ErrorCategoryEnum } from './baseConfig'

const taskQueue = new TaskQueue()

// 监控基类
class BaseMonitor {
    /**
     * @constructor
     * @param {object} params 初始化参数
     * @param {string} params.reportUrl 上报路径
     * @param {object} params.extendsInfo 扩展信息
     * @param {object} params.reportMethod 上报方式
     */
    constructor({ reportUrl, extendsInfo, reportMethod }) {
        this.category = ErrorCategoryEnum.UNKNOWN_ERROR // 错误类型
        this.level = ErrorLevelEnum.INFO // 错误等级
        this.msg = {} // 错误信息
        this.url = '' // 错误信息地址
        this.stack = [] // 错误堆栈
        this.otherErrorInfo = {} // 其他错误内容

        this.reportUrl = reportUrl // 上报错误地址
        this.extendsInfo = extendsInfo // 扩展信息
        this.reportMethod = reportMethod
    }

    /**
     * 记录错误信息
     * @public
     * @return void
     */
    recordError() {
        this._handleRecordError()
        // 延迟记录日志
        setTimeout(() => {
            if (taskQueue.isStop) taskQueue.fire() // 停止则fire
        }, 100)
    }

    /**
     * 记录错误日志
     * @private
     * @return void
     */
    _handleRecordError() {
        try {
            if (!this.msg) {
                return
            }
            // 过滤掉错误上报地址
            if (
                this.reportUrl &&
                this.url &&
                this.url.toLowerCase().indexOf(this.reportUrl.toLowerCase()) >= 0
            ) {
                console.log('统计错误接口异常', this.msg)
                return
            }
            const errorInfo = this._handleErrorInfo()
            console.log(`\nIt's ${this.category}`, errorInfo)
            // 记录日志
            taskQueue.add(this.reportUrl, this.reportMethod, errorInfo)
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * 处理错误信息
     * @private
     * @return {object} 错误信息对象
     */
    _handleErrorInfo() {
        const logInfo = {
            url: this.url,
            errorInfo: this.msg,
            otherErrorInfo: this.otherErrorInfo,
            stack: this.stack,
        }
        const deviceInfo = this._getDeviceInfo()
        const extendsInfo = this._getExtendsInfo()
        const recordInfo = {
            logType: this.level,
            category: this.category,
            logInfo: JSON.stringify(logInfo),
            deviceInfo: JSON.stringify(deviceInfo),
            extendsInfo: JSON.stringify(extendsInfo),
        }
        console.log('recordInfo: ', recordInfo)
        return recordInfo
    }

    /**
     * 获取扩展信息
     * @private
     * @return {object} 扩展信息对象
     */
    _getExtendsInfo() {
        try {
            const ret = {}
            let extendsInfo = this.extendsInfo || {}
            let dynamicParams
            if (utils.isFunction(extendsInfo.getDynamic)) {
                dynamicParams = extendsInfo.getDynamic() // 获取动态参数
            }
            // 判断动态方法返回的参数是否是对象
            if (utils.isObject(dynamicParams)) {
                extendsInfo = { ...extendsInfo, ...dynamicParams }
            }
            // 遍历扩展信息，排除动态方法
            Object.keys(extendsInfo).forEach((key) => {
                if (!utils.isFunction(extendsInfo[key])) {
                    // 排除获取动态方法
                    ret[key] = extendsInfo[key]
                }
            })
            return ret
        } catch (error) {
            console.log('call _getExtendsInfo error', error)
            return {}
        }
    }

    /**
     * 获取设备信息
     * @private
     * @return {object} 设备信息对象
     */
    _getDeviceInfo() {
        try {
            const deviceInfo = DeviceInfo.getDeviceInfo()
            return deviceInfo
        } catch (error) {
            console.log(error)
            return ''
        }
    }
}
export default BaseMonitor
