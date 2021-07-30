import BaseMonitor from '../base/baseMonitor'
import { ErrorLevelEnum, ErrorCategoryEnum } from '../base/baseConfig.js'

import API from '../base/api'

// 网速检测
class MonitorNetworkSpeed extends BaseMonitor {
	constructor(options) {
		super(options || {})
		this.category = ErrorCategoryEnum.NETWORK_SPEED
		this.pageId = options.pageId || ''
		this.url = options.url || ''
	}

	// 图片大小 bytes
	downloadSize = 255438

	// 图片地址
	filePath = 'https://file.40017.cn/tcservice/common/imags/network_speed.png'

	// 开始时间
	startTime = 0

	// 结束时间
	endTime = 0

	// 上报定时间隔
	timeInterval = 60 * 1000

	// 当前时间
	now() {
		return (
			performance.now() ||
			performance.webkitNow() ||
			performance.msNow() ||
			performance.oNow() ||
			performance.mozNow() ||
			new Date().getTime()
		)
	}

	// 上报网络速度
	reportNetworkSpeed() {
		this.getSpeed()
		//定时上报
		setInterval(() => {
			this.getSpeed()
		}, this.timeInterval)
	}

	// 第一种方式：根据XHR获取网速
	getSpeed() {
		try {
			let fileSize
			let xhr = new XMLHttpRequest()
			xhr.onreadystatechange = () => {
				if (xhr.readyState === 2) {
					this.startTime = Date.now()
				}
				if (xhr.readyState === 4 && xhr.status === 200) {
					this.endTime = Date.now()
					fileSize = xhr.responseText.length
					//单位（KB/s）
					let speed = (
						fileSize /
						((this.endTime - this.startTime) / 1000) /
						1024
					).toFixed(2)
					let extendsInfo = this._getExtendsInfo()
					let data = {
						...extendsInfo,
						category: this.category,
						logType: ErrorLevelEnum.INFO,
						logInfo: JSON.stringify({
							curTime: new Date().format('yyyy-MM-dd HH:mm:ss'),
							pageId: this.pageId,
							networkSpeed: speed,
							deviceInfo: this._getDeviceInfo(),
						}),
					}
					console.log("It's network_speed", data)
					new API(this.url).report(data)
				}
			}
			xhr.open('GET', this.filePath + '?rand=' + Math.random(), true)
			xhr.send()
		} catch (error) {
			console.log('测试失败：', error)
		}
	}

	// 第二种方式：获取网络速度
	getSpeedByImg() {
		let img = new Image()
		img.onload = () => {
			this.endTime = this.now()
			this.calcSpeed()
		}
		this.startTime = this.now()
		img.src = this.filePath + '?rand=' + this.startTime
	}

	// 计算速度
	calcSpeed() {
		let duration = (this.endTime - this.startTime) / 1000
		let bitsLoaded = this.downloadSize * 8
		let speedBps = (bitsLoaded / duration).toFixed(2)
		let speedKbps = (speedBps / 1024).toFixed(2)
		let speedMbps = (speedKbps / 1024).toFixed(2)
		return {
			speedKbps,
			speedMbps,
		}
	}
}

export default MonitorNetworkSpeed
