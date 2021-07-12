<template>
	<view class="detail">
		<view class="fixbg" :style="{'background-image': 'url('+ songDetail.al.picUrl +')'}"></view>
		<musichead :title="songDetail.name" :icon="true" color="white"></musichead>
		<view class="container" v-show="!isLoading">
			<scroll-view scroll-y="true">
				<view class="detail-play" @tap="handleToPlay">
					<image :src="songDetail.al.picUrl" :class="{'detail-play-run': isPlayRotate}" mode=""></image>
					<text class="iconfont" :class="iconPlay"></text>
					<view></view>
				</view>
				<!--歌词-->
				<view class="detail-lyric">
					<view class="detail-lyric-wrap" :style="{ transform : 'translateY(' +  - (lyricIndex - 1) * 82  + 'rpx)' }">
						<view class="detail-lyric-item" :class="{active : lyricIndex == index}" v-for="(item, index) in songLyric" :key="index">{{ item.lyric }}</view>
					</view>
				</view>
				<!--喜欢这首歌的人也听-->
				<view class="detail-like">
					<view class="detail-like-title">喜欢这首歌的人也听</view>
					<view class="detail-like-list">
						<view class="detail-like-item" v-for="(item, index) in songSimi" :key="index" @tap="handleToSimi(item.id)">
							<view class="detail-like-img">
								<image :src="item.album.picUrl" mode=""></image>
							</view>
							<view class="detail-like-song">
								<view>{{ item.name }}</view>
								<view>
									<image v-if="item.privilege.flag > 60 && item.privilege.flag < 70" src="../../static/dujia.png" mode=""></image>
									<image v-if="item.privilege.maxbr == 999000 " src="../../static/sq.png" mode=""></image>
									{{item.artists[0].name}} - {{ item.name }}
								</view>
							</view>
							<!--播放按钮-->
							<text class="iconfont icon-play"></text>
						</view>
					</view>
				</view>
				<!--评论-->
				<view class="detail-comment">
					<view class="detail-comment-head">精彩评论</view>
					<view class="detail-comment-item" v-for="(item, index) in songComment" :key="index">
						<view class="detail-comment-img">
							<!--评论用户头像-->
							<image :src="item.user.avatarUrl" mode=""></image>
						</view>
						<view class="detail-comment-content">
							<view class="detail-comment-title">
								<view class="detail-comment-name">
									<view>{{ item.user.nickname }}</view>
									<view>{{ item.time | formatTime }}</view>
								</view>
								<view class="detail-comment-like">{{ item.likedCount | formatCount }}<text class="iconfont icon-dianzan1"></text>
								</view>
							</view>
							<view class="detail-comment-text">{{ item.content }}</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import '@/common/iconfont.css'
	import musichead from '../../components/musicHead/musicHead.vue'
	import {songDetail, songSimi, songComment, songLyric, songUrl} from '../../common/api.js'
	export default {
		data() {
			return {
				songDetail: {
					al : { picUrl : '' }
				},
				songSimi : [],
				songComment : [],
				songLyric : [],
				lyricIndex : 0,
				iconPlay: 'icon-zanting', 
				isPlayRotate: true,
				isLoading : true // 加载状态
			}
		},
		components:{
			musichead
		},
		// 接收传递过来的歌曲id
		onLoad(options) {
			// console.log(options.songId)
			this.getMusic(options.songId)
		},
		// 离开当前页面，回到上一级的时候，清除定时器
		onUnload(){
			this.cancelLyricIndex()
			// #ifdef H5
			this.bgAudioMannager.destroy()
			// #endif
		},
		// 回到首页的时候，清除定时器
		onHide(){
			this.cancelLyricIndex()
			// #ifdef H5
			this.bgAudioMannager.destroy()
			// #endif
		},
		methods: {
			getMusic(songId){
				
				this.$store.commit('NEXT_ID', songId)
				
				uni.showLoading({
					title:'加载中...'
				});
				this.isLoading = true;
				
				Promise.all([songDetail(songId), songSimi(songId), songComment(songId), songLyric(songId), songUrl(songId)]).then((res)=>{
					// console.log(res)
					if(res[0][1].data.code == '200'){
						this.songDetail = res[0][1].data.songs[0];
					}
					if(res[1][1].data.code == '200'){
						this.songSimi = res[1][1].data.songs
					}
					if(res[2][1].data.code == '200'){
						this.songComment = res[2][1].data.hotComments;
					}
					// 歌词
					if(res[3][1].data.code == '200'){
						// 先拿到歌词
						let lyric = res[3][1].data.lrc.lyric;
						// console.log(lyric)
						// 歌词停留的时间
						let result = [];
						// 正则表达式分隔歌词
						let re = /\[([^\]]+)\]([^\[]+)/g;
						// console.log(re.exec(lyric))
						lyric.replace(re,($0,$1,$2)=>{
							result.push({ "time" : this.formatTimeToSec($1) , "lyric" : $2 });
						});
						// 进行映射
						this.songLyric = result;
					}
					// 获取音频地址
					if(res[4][1].data.code == '200'){
						// #ifdef MP-WEIXIN
						// 创建背景音频播放管理 实例
						this.bgAudioMannager = uni.getBackgroundAudioManager()
						this.bgAudioMannager.title = this.songDetail.name;
						// #endif
						// #ifdef H5
						if(!this.bgAudioMannager){
							this.bgAudioMannager = uni.createInnerAudioContext();
						}
						this.iconPlay = 'icon-bofang'
						this.isPlayRotate = false
						// #endif
						
						this.bgAudioMannager.src = res[4][1].data.data[0].url || '';
						this.listenLyricIndex()
						// 监听播放状态事件, 只要播放就会触发
						this.bgAudioMannager.onPlay(()=>{
							this.iconPlay = 'icon-zanting';
							this.isPlayRotate = true;
							this.listenLyricIndex()
						});
						// 监听暂停状态事件, 只要暂停就会触发
						this.bgAudioMannager.onPause(()=>{
							this.iconPlay = 'icon-bofang';
							this.isPlayRotate = false;
							this.cancelLyricIndex()
						});
						// 监听上一首歌播放完毕，自动播放下一首歌
						this.bgAudioMannager.onEnded(()=>{
							this.getMusic(this.$store.state.nextId)
						})
					}
					this.isLoading = false;
					uni.hideLoading()
				})
			},
			// 转化成秒
			formatTimeToSec(time){
				// 分钟和秒分隔开后存放到数组中
				var arr = time.split(':');
				// 先把数字进行操作，再进行toFixed转换，最后返回转换成秒的结果
				return (parseFloat(arr[0]) * 60 + parseFloat(arr[1])).toFixed(2);
			},
			// 监听点击播放
			handleToPlay(){
				// 如果是播放状态就开始播放, backgroundAudioManager对象的属性paused是否暂停
				if(this.bgAudioMannager.paused){// true表示暂停, 点击触发播放
					this.bgAudioMannager.play();
				}else{ // 否则, 点击触发暂停播放
					this.bgAudioMannager.pause();
				}
			},
			//利用节流实现监听事件慢加载
			listenLyricIndex(){
				clearInterval(this.timer);
				// 监听歌词的变化, 每500毫秒监听一次
				this.timer = setInterval(()=>{
					for(var i=0;i<this.songLyric.length;i++){
						// 播放时间小于最后一条歌词的时候
						if(this.songLyric[this.songLyric.length-1].time < this.bgAudioMannager.currentTime){
							this.lyricIndex = this.songLyric.length-1;
							break;
						}
						if(this.bgAudioMannager.currentTime > this.songLyric[i].time && this.bgAudioMannager.currentTime < this.songLyric[i+1].time){
							this.lyricIndex = i
						}
					}
					// console.log(this.lyricIndex)
				}, 500)
			},
			// 优化性能，防止暂停的时候定时器继续，影响性能
			cancelLyricIndex(){
				clearInterval(this.timer)
			},
			handleToSimi(songId){
				this.getMusic(songId)
			}
		}
	}
</script>

<style scoped>
	/* 详情信息 */
	.detail-play{ 
		width:580rpx; 
		height:580rpx; 
		background:url(~@/static/disc.png); 
		background-size:cover; 
		margin:210rpx auto 44rpx auto; 
		position: relative;
	}
	.detail-play image{ 
		width:380rpx; 
		height:380rpx; 
		position: absolute; 
		left:0; 
		top:0; 
		right:0; 
		bottom:0; 
		margin:auto; 
		border-radius: 50%;
		animation:move 10s linear infinite;
		animation-play-state: paused;
	}
	.detail-play .detail-play-run{animation-play-state: running;}
	@keyframes move{
		from{transform: rotate(0deg);}
		to{transform: rotate(360deg);}
	}
	.detail-play text{
		width:100rpx; 
		height:100rpx; 
		font-size:100rpx; 
		position: absolute; 
		left:0; 
		top:0; 
		right:0; 
		bottom:0; 
		margin:auto; 
		color:white;
	}
	.detail-play view{
		position: absolute; 
		width:180rpx; 
		height:266rpx; 
		position: absolute; 
		left:60rpx; 
		right:0;  
		margin:auto; 
		top:-170rpx; 
		background:url(~@/static/needle.png); 
		background-size:cover;
	}
	.detail-lyric{
		height:246rpx; 
		line-height: 82rpx; 
		font-size:32rpx; 
		text-align: center; 
		color:#949495; 
		overflow: hidden;
	}
	.detail-lyric-wrap{transition: .5s;}
	.detail-lyric-item{
		height:82rpx;
	}
	.detail-lyric-item.active{
		color: white;
	}
	/* 喜欢这首歌的人也喜欢... */
	.detail-like{ 
		margin:0 32rpx;
	}
	.detail-like-title{ 
		font-size:36rpx; 
		color:white; 
		margin:50rpx 0;
	}
	.detail-like-item{ 
		display: flex;
		margin-bottom:38rpx; 
		align-items: center;
	}
	.detail-like-img{ 
		width:82rpx; 
		height:82rpx; 
		border-radius: 15rpx; 
		overflow: hidden; 
		margin-right:20rpx;
	}
	.detail-like-img image{ width:100%; height:100%;}
	.detail-like-song{ flex:1;}
	.detail-like-song view:nth-child(1){ 
		color:white; 
		font-size:30rpx; 
		width:70vw; 
		white-space: nowrap; 
		overflow: hidden; 
		text-overflow: ellipsis; 
		margin-bottom: 10rpx;
	}
	.detail-like-song view:nth-child(2){ 
		font-size:22rpx; 
		color:#a2a2a2; 
		width:70vw; 
		white-space: nowrap; 
		overflow: hidden; 
		text-overflow: ellipsis;
	}
	.detail-like-song image{ 
		width:34rpx; 
		height:22rpx; 
		margin-right:10rpx;
	}
	.detail-like-item text{ 
		font-size:50rpx; 
		color:#877764;
	}
	/* 评论 */
	.detail-comment{
		margin:0 32rpx;
	}
	.detail-comment-head{ 
		font-size:36rpx; 
		color:white; 
		margin:50rpx 0;
	}
	.detail-comment-item{ 
		display: flex; 
		margin-bottom:28rpx;
	}
	.detail-comment-img{ 
		width:66rpx; 
		height:66rpx; 
		border-radius: 50%; 
		overflow: hidden; 
		margin-right:18rpx;
	}
	.detail-comment-img image{ width:100%; height:100%}
	.detail-comment-content{ 
		flex:1; 
		color:#cac9cd;
	}
	.detail-comment-title{ 
		display: flex; 
		justify-content: 
		space-between;
	}
	.detail-comment-name view:nth-child(1){ font-size:24rpx;}
	.detail-comment-name view:nth-child(2){ font-size:20rpx;}
	.detail-comment-like{ font-size:30rpx;}
	.detail-comment-text{ 
		line-height: 40rpx; 
		color:white; 
		font-size:28rpx; 
		margin-top:16rpx; 
		padding-bottom: 40rpx;
		border-bottom:1px #595860 solid; 
	}
</style>
