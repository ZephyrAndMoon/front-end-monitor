import utils from '../utils/util.js'
import DeviceInfo from '../device'
import TaskQueue from './taskQueue.js'
import { ErrorLevelEnum, ErrorCategoryEnum } from './baseConfig.js'

const taskQueue = new TaskQueue()

// 监控基类
class BaseMonitor {
	/**
	 * @constructor
	 *
	 * @param {object} params { reportUrl,extendsInfo }
	 */
	constructor({ reportUrl, extendsInfo }) {
		this.category = ErrorCategoryEnum.UNKNOWN_ERROR //错误类型
		this.level = ErrorLevelEnum.INFO //错误等级
		this.msg = {} //错误信息
		this.url = '' //错误信息地址
		this.col = '' //列数
		this.line = '' //行数
		this.stack = '' //错误堆栈
		this.otherErrorInfo = {} //其他错误内容
		this.sourcemapFileName = '' // 映射的sourcemap文件名

		this.reportUrl = reportUrl //上报错误地址
		this.extendsInfo = extendsInfo //扩展信息
	}

	/**
	 * 记录错误信息
	 *
	 * @public
	 */
	recordError() {
		this._handleRecordError()
		//延迟记录日志
		setTimeout(() => {
			taskQueue.isStop && taskQueue.fire() //停止则fire
		}, 100)
	}

	/**
	 * 处理错误日志
	 *
	 * @private
	 */
	_handleRecordError() {
		try {
			if (!this.msg) {
				return
			}
			//过滤掉错误上报地址
			if (
				this.reportUrl &&
				this.url &&
				this.url.toLowerCase().indexOf(this.reportUrl.toLowerCase()) >=
					0
			) {
				console.log('统计错误接口异常', this.msg)
				return
			}
			let errorInfo = this._handleErrorInfo()

			console.log("\nIt's " + this.category, errorInfo)

			//记录日志
			taskQueue.add(this.reportUrl, errorInfo)
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * 处理错误信息
	 *
	 * @private
	 */
	_handleErrorInfo() {
		let logInfo = {
			url: this.url,
			errorInfo: this.msg,
			otherErrorInfo: this.otherErrorInfo,
		}

		
		if (this.stack) {
			logInfo = {
				...logInfo,
				col: this.col,
				line: this.line,
				stack: this.stack,
				sourcemapFileName: this.sourcemapFileName,
			}
		}
		const deviceInfo = this._getDeviceInfo()
		const extendsInfo = this._getExtendsInfo()
		let recordInfo = {
			...extendsInfo,
			deviceInfo,
			category: this.category,
			logType: this.level,
			logInfo: logInfo,
		}
		console.log('recordInfo: ', recordInfo)
		return recordInfo
	}

	/**
	 * 获取扩展信息
	 *
	 * @private
	 */
	_getExtendsInfo() {
		try {
			let ret = {}
			let extendsInfo = this.extendsInfo || {}
			let dynamicParams
			if (utils.isFunction(extendsInfo.getDynamic)) {
				dynamicParams = extendsInfo.getDynamic() //获取动态参数
			}
			//判断动态方法返回的参数是否是对象
			if (utils.isObject(dynamicParams)) {
				extendsInfo = { ...extendsInfo, ...dynamicParams }
			}
			//遍历扩展信息，排除动态方法
			for (var key in extendsInfo) {
				if (!utils.isFunction(extendsInfo[key])) {
					//排除获取动态方法
					ret[key] = extendsInfo[key]
				}
			}
			return ret
		} catch (error) {
			console.log('call _getExtendsInfo error', error)
			return {}
		}
	}

	/**
	 * 获取设备信息
	 *
	 * @private
	 */
	_getDeviceInfo() {
		try {
			let deviceInfo = DeviceInfo.getDeviceInfo()
			return deviceInfo
		} catch (error) {
			console.log(error)
			return ''
		}
	}
}
export default BaseMonitor
