import {baseUrl} from "./config.js"
// 请求接口
export function topList(){
	// 修改后，id是不同版单的唯一值
	let listIds = ['19723756' , '3779629' , '2884035' , '3778678' ];
	
	return new Promise(function(resolve, reject){
		uni.request({
			url: `${baseUrl}/toplist/detail`,
			method: 'GET',
			data: {},
			success: res => {
				let result = res.data.list;
				result.length = 4;
				// 遍历一遍，把结果返出去
				for(var i = 0; i < listIds.length; i++){
					result[i].listId = listIds[i];
				} 
				resolve(result)
			},
			fail: () => {
				
			},
			complete: () => {
				
			}
		})
	})
}
// 歌曲列表接口
export function list(listId){
	return uni.request({
		url: `${baseUrl}/playlist/detail?id=${listId}`,
		method: 'GET'
	});
}

// 获取所有歌曲详情
export function songDetail(id){
	return uni.request({
		url : `${baseUrl}/song/detail?ids=${id}`,
		method : 'GET'
	})
}

// 获取相似音乐
export function songSimi(id){
	return uni.request({
		url : `${baseUrl}/simi/song?id=${id}`,
		method : 'GET'
	})
}

// 歌曲评论
export function songComment(id){
	return uni.request({
		url : `${baseUrl}/comment/music?id=${id}`,
		method : 'GET'
	})
}

// 获取歌词
export function songLyric(id){
	return uni.request({
		url : `${baseUrl}/lyric?id=${id}`,
		method : 'GET'
	})
}

// 获取音频地址
export function songUrl(id){
	return uni.request({
		url : `${baseUrl}/song/url?id=${id}`,
		method : 'GET'
	})
}

// 热搜列表(详细)
export function searchHot(){
	return uni.request({
		url : `${baseUrl}/search/hot/detail`,
		method : 'GET'
	})
}
// 搜索结果
export function searchWord(word){
	return uni.request({
		url : `${baseUrl}/search?keywords=${word}`,
		method : 'GET'
	})
}
// 搜索建议
export function searchSuggest(word){
	return uni.request({
		url : `${baseUrl}/search/suggest?keywords=${word}&type=mobile`,
		method : 'GET'
	})
}