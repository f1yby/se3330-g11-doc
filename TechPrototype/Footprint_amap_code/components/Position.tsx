import React from "react";
import {Geolocation, init, setAllowsBackgroundLocationUpdates,} from "react-native-amap-geolocation";

// 定位操作
export async function geolocationInit() {
    // 设置高德 key
    await init({
        ios: "9bd6c82e77583020a73ef1af59d0c759",
        android: "2b98dcea615041bc691ba73942fddc84",
    });

    // 必须在开始定位之前或者定位stop的时候设置
    setAllowsBackgroundLocationUpdates(true);
}

// 只获得一次当前地理位置
export function getCurrentPosition() {
    const p = new Promise(function (resolve, reject) {
        Geolocation.getCurrentPosition(position => {
            console.log("SUCCESS 获取当前地理位置成功", position);
            resolve(position);
        });
    });
    return p;
}


// 逆地理编码获取周围位置信息
export const getAddress = (lng, lat) => {
    return new Promise(function (resolve, reject) {
        fetch(
            `https://restapi.amap.com/v3/geocode/regeo?key=beba67dedb3de25a4f91da96b33c62c0&extensions=all&location=${lng},${lat}`,
            {
                method: 'GET',
            },
        )
            .then(response => response.json())
            .then(result => {
                console.log('SUCCESS 逆地理编码获取结果 ', result);
                resolve(result);
            })
            .catch(error => {
                console.log('ERROR 逆地理编码获取错误 ', error);
                reject(error);
            });
    });
};

// 根据起点终点进行步行路径规划
export const getWalkingRoute = (ori_lng, ori_lat, des_lng, des_lat) => {
    return new Promise(function (resolve, reject) {
        fetch(
            `https://restapi.amap.com/v5/direction/walking?key=beba67dedb3de25a4f91da96b33c62c0&origin=${ori_lng},${ori_lat}&destination=${des_lng},${des_lat}&show_fields=polyline`,
            {
                method: 'GET',
            },
        )
            .then(response => response.json())
            .then(result => {
                console.log('SUCCESS 步行路径规划获取结果 ', result);
                resolve(result);
            })
            .catch(error => {
                console.log('ERROR 步行路径规划获取错误 ', error);
                reject(error);
            });
    });
};

// 根据起点终点进行驾车路径规划
export const getDrivingRoute = (ori_lng, ori_lat, des_lng, des_lat, waypoints) => {
    return new Promise(function (resolve, reject) {
        fetch(
            `https://restapi.amap.com/v5/direction/driving?key=beba67dedb3de25a4f91da96b33c62c0&origin=${ori_lng},${ori_lat}&destination=${des_lng},${des_lat}&waypoints=${waypoints}&show_fields=polyline`,
            {
                method: 'GET',
            },
        )
            .then(response => response.json())
            .then(result => {
                console.log('SUCCESS 驾车路径规划获取结果 ', result);
                resolve(result);
            })
            .catch(error => {
                console.log('ERROR 驾车路径规划获取错误 ', error);
                reject(error);
            });
    });
};

// 关键字搜索周边地理位置
export const searchAroundLocation = (lng, lat, keywords) => {
    console.log("keywords:", keywords);
    return new Promise(function (resolve, reject) {
        fetch(
            `https://restapi.amap.com/v5/place/around?key=beba67dedb3de25a4f91da96b33c62c0&&location=${lng},${lat}&keywords=${keywords}`,
            {
                method: 'GET',
            },
        )
            .then(response => response.json())
            .then(result => {
                console.log('SUCCESS 搜索周边地理位置获取结果 ', result);
                resolve(result);
            })
            .catch(error => {
                console.log('ERROR 搜索周边地理位置错误 ', error);
                reject(error);
            });
    });
};




// 搜索输入提示
export const getSearchTips = (lng, lat, keywords) => {
    console.log("keywords:", keywords);
    return new Promise(function (resolve, reject) {
        fetch(
            `https://restapi.amap.com/v3/assistant/inputtips?key=beba67dedb3de25a4f91da96b33c62c0&location=${lng},${lat}&keywords=${keywords}`,
            {
                method: 'GET',
            },
        )
            .then(response => response.json())
            .then(result => {
                console.log('SUCCESS 搜索输入提示获取结果 ', result);
                resolve(result);
            })
            .catch(error => {
                console.log('ERROR 搜索输入提示错误 ', error);
                reject(error);
            });
    });
};







