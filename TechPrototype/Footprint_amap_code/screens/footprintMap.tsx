import * as React from "react";
import {MapType, MapView, Marker, Polyline} from "react-native-amap3d";
import {
    Button,
    FlatList, Image,
    ListRenderItemInfo,
    NativeSyntheticEvent,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    geolocationInit,
    getAddress,
    getCurrentPosition,
    getWalkingRoute,
    getDrivingRoute,
    searchAroundLocation, getSearchTips
} from "../components/Position";
import {Geolocation} from "react-native-amap-geolocation";
import {Picker} from "@react-native-picker/picker";
import ActionSheet from 'react-native-actionsheet';
import SearchBar from "react-native-search-bar";
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ActionButton from "react-native-action-button";
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import IconF5 from 'react-native-vector-icons/FontAwesome5';
import IconM from 'react-native-vector-icons/MaterialIcons';


export default class extends React.Component {

    state = {
        // TODO: 状态码: 字符串
        // normal 显示地图页面
        // planRoute  路径规划状态——可添加删去 Marker
        // planRouteShow  路径规划完成状态——显示规划完成的路径
        // footprintRecord  足迹记录状态——实时记录并显示用户足迹在页面上，并显示用户的打卡点
        // footprintShow  足迹显示状态——显示刚刚结束的足迹在页面上
        status: "normal",
        markersEditable: false,
        markers: [],
        planRoute: [],  // 所有有关规划的路径的数据
        planRoutePolyline: [],  // 用于绘制规划的路径的数据
        isRecordingFootprint: false,  // 记录此时有无录制足迹
        footprintData: [],
        logs: [],
        location: null,
        mapType: MapType.Standard,

        // 搜索
        searchText: "",
        searchTipsText: [],
        searchTipsLocation: [],

        // 拍照打卡
        photoMarkers:[],
        imgs:[],
    };
    watchId?: number | null;
    search = React.createRef();

    async componentDidMount() {
        console.log(this.state.markers);
        if (Platform.OS === "android") {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ]);
            console.log(result);
        }
        // 初始化高德 key
        geolocationInit();
    }

    sleep (time){
        return new Promise((resolve) => {
            setTimeout(resolve, time)
        })
    }

    wait(){
        console.log("start sleep");
        this.sleep(1000);
        console.log("sleep finished");
    }


    addPhoto = () => {
        launchImageLibrary(
            {
                mediaType: 'photo', // 'photo' or 'video' or 'mixed'
                selectionLimit: 0, // 1为一张，0不限制数量
                includeBase64: true,
            },
            res => {
                const photoMarkers = this.state.photoMarkers;
                const photoMarker = {imgs: res.assets, location: this.state.location,};
                this.setState({imgs: res.assets, photoMarkers:[...photoMarkers, photoMarker]});
            },
        );
    };

    addVideo = () => {
        launchImageLibrary(
            {
                mediaType: 'video',
                selectionLimit: 1,
            },
            res => {
                const photoMarkers = this.state.photoMarkers;
                const photoMarker = {imgs: res.assets, location: this.state.location,};
                this.setState({imgs: res.assets, photoMarkers:[...photoMarkers, photoMarker]});
            },
        );
    };

    tackPhoto = () => {
        launchCamera(
            {
                mediaType: 'photo',
                cameraType: 'back',
            },
            res => {
                //alert(res.errorCode);
                const photoMarkers = this.state.photoMarkers;
                const photoMarker = {imgs: res.assets, location: this.state.location,};
                console.log(photoMarker);
                this.setState({imgs: res.assets, photoMarkers:[...photoMarkers, photoMarker]});
            },
        );
    };


    // 地图类型选择
    setMapType(value: MapType){
        this.setState({mapType: value,});
    }

    // ActionSheet
    showPlanRouteActionSheet = () => {
        this.PlanRouteActionSheet.show();
    }

    showMapTypeActionSheet = () => {
        this.MapTypeActionSheet.show();
    }

    showPhotoAlbumVideoActionSheet = () => {
        this.PhotoAlbumVideoActionSheet.show();
    }

    handlePlanRouteActionSheetSelect(index){
        if(index == 0) {this.planDrivingRoute(); return;}
        if(index == 1) {this.planWalkingRoute(); return;}
        if(index == 2) {return;}
    }

    handleMapTypeActionSheetSelect(index){
        let mapTypes = [MapType.Standard, MapType.Satellite, MapType.Navi, MapType.Night, MapType.Bus]
        this.setMapType(mapTypes[index]);
    }

    handlePhotoAlbumVideoSheetSelect(index){
        if(index == 0) {this.tackPhoto();; return;}  // 拍摄照片
        if(index == 1) {this.addPhoto(); return;}  // 打开相册
        if(index == 2) {this.addVideo();return;}  // 拍摄视频
        if(index == 3) {return;}
    }



    handleSearchButtonPressed(){  // TODO: 搜索到之后干什么？
        console.log('Search Button pressed');
        const location = this.state.location;
        const pois = searchAroundLocation(location.coords.longitude, location.coords.latitude, this.state.searchText)
            .then(res => {
                console.log(res);
            })
            .catch(err => {
                console.log('周边地点搜索失败');
            });
        this.search.unFocus();
        this.setState({searchTipsText:[]});
    }

    handleSearchTipClicked(searchTip: string){
        console.log('Search Tip clicked ', searchTip);
        const markers = this.state.markers;
        const searchTipsText = this.state.searchTipsText;
        const searchTipLocation = this.state.searchTipsLocation[searchTipsText.findIndex(item => item === searchTip)];
        const marker = this.convertPolylineStr2ArrJSON(searchTipLocation);
        //  TODO: 设置搜索框内为关键词 tip
        this.search.unFocus();
        this.setState({searchText: searchTip, searchTipsText:[], searchTipsLocation:[],markers: [...markers, marker[0]]});
    }

    moveMapViewToLocation(lng, lat){

    }


    handleSearchTextChange(newSearchText: string){
        console.log('Search Text changed');
        const location = this.state.location;
        if(location && newSearchText != ""){
            const pois = getSearchTips(location.coords.longitude, location.coords.latitude, newSearchText)
                .then(res => {
                    console.log('搜索输入提示', res);
                    const searchTipsText = res.tips.map((tip)=>(tip.name));
                    const searchTipsLocation = res.tips.map((tip)=>(tip.location));
                    console.log(searchTipsText, searchTipsLocation);
                    this.setState({searchTipsText: searchTipsText, searchTipsLocation: searchTipsLocation});
                })
                .catch(err => {
                    console.log('搜索输入提示失败');
                });
        }
        if(newSearchText == "") this.setState({searchTipsText: [], searchTipsLocation: []});
        this.setState({searchText: newSearchText,});
        console.log(newSearchText);
    }

    // updateLocationState(location: Position | PositionError) {
    //     if (location) {
    //         this.setState({ location });
    //         console.log(location);
    //     }
    // }
    //
    // getCurrentPosition = () => {
    //     Geolocation.getCurrentPosition(
    //         (position) => this.updateLocationState(position),
    //         (error) => this.updateLocationState(error)
    //     );
    // };

    updateLocationOnce(){
        // 获取当前地理位置信息
        const pos = getCurrentPosition()
            .then(res => {
                console.log("getCurrentPosition", res);
                const pois = getAddress(res.coords?.longitude, res.coords?.latitude) // 获取经纬度,来获取周围位置
                    .then(res => {
                        const address = res?.regeocode.formatted_address;
                        alert("您现在位于" + address + "附近");
                        console.log(address);
                    })
                    .catch(err => {
                        console.log('逆地理位置编码失败');
                    });
            })
            .catch(err => {
                console.log('当前定位失败');
            });
    }

    // 注册一个监听，每隔一段时间返回当前地理位置
    watchPosition(watchId) {
        if (!watchId) {
            this.setState({footprintData: [],});
            return Geolocation.watchPosition(
                position => {
                    console.log('监听地理位置 ',position);
                    const footprintData = this.state.footprintData;
                    this.setState({footprintData: [...footprintData, position],});
                    console.log(this.state.footprintData);
                }
            );
        }
        else return watchId;
    };

    // 结束监听
    clearWatch(watchId) {
        if (watchId) {
            Geolocation.clearWatch(watchId);
            this.watchId = null;

            // show final footprint

            // upload footprint


        }
    };

    startRecordFootprint(){
        this.watchId = this.watchPosition(this.watchId);
    }

    finishRecordFootprint(){
        this.clearWatch(this.watchId);

        // this.setState({ location: null });
    }

    planDrivingRoute(){
        const markers = this.state.markers;
        if(markers.length < 1) {
            alert("Need 1 or more markers to plan route !");
            return;
        }
        if(markers.length > 16){
            alert("Only support 16 or less markers to plan driving route !");
            return;
        }
        const desPos = markers[markers.length-1];
        const oriPos = this.state.location;
        if(oriPos == null){
            alert("Can't locate your current pos, please check your GPS !");
            return;
        }

        // 生成途经点字符串
        let waypointsArr = markers.map((position) => (`${position.longitude},${position.latitude}`));
        waypointsArr.pop();  // 去除目的地
        let waypointsStr = waypointsArr.join(";");
        console.log(waypointsStr);

        // TODO: 让用户选择是否从自己当前位置开始
        console.log(desPos,oriPos);
        const pois = getDrivingRoute( oriPos.coords.longitude, oriPos.coords.latitude, desPos.longitude, desPos.latitude, waypointsStr)
            .then(res => {
                let planRoutePolyline = this.convertPolylineStr2ArrJSON(this.convertPlanRouteData2PolylineStr(res));  // 如若刚刚规划完路径，转换并绘制
                console.log('驾车路径规划 planRoutePolyline ', planRoutePolyline);
                this.setState({planRoute: res, planRoutePolyline: planRoutePolyline,});
            })
            .catch(err => {
                console.log('驾车路径规划失败');
            });
    }

    planWalkingRoute(){
        const markers = this.state.markers;
        if(markers.length < 1) {
            alert("Need 1 or more markers to plan route !");
            return;
        }
        if(markers.length != 1) {
            alert("步行路径规划仅支持设置单一标记点!");
            return;
        }
        const desPos = markers[0];
        const oriPos = this.state.location;
        if(oriPos == null){
            alert("Can't locate your current pos, please check your GPS !");
            return;
        }
        // TODO: 让用户选择是否从自己当前位置开始
        console.log(desPos,oriPos);
        const pois = getWalkingRoute( oriPos.coords.longitude, oriPos.coords.latitude, desPos.longitude, desPos.latitude)
            .then(res => {
                let planRoutePolyline = this.convertPolylineStr2ArrJSON(this.convertPlanRouteData2PolylineStr(res));  // 如若刚刚规划完路径，转换并绘制
                this.setState({planRoute: res, planRoutePolyline: planRoutePolyline,});
            })
            .catch(err => {
                console.log('步行路径规划失败');
            });
        let i = 1;
        for(; i < markers.length; ++i){
            const oriPos = markers[i - 1];
            const desPos = markers[i];
            console.log(desPos,oriPos);
            this.wait();
            const pois = getWalkingRoute( oriPos.longitude, oriPos.latitude, desPos.longitude, desPos.latitude)
                .then(res => {
                    let newPlanRoutePolyline = this.convertPolylineStr2ArrJSON(this.convertPlanRouteData2PolylineStr(res));  // 如若刚刚规划完路径，转换并绘制
                    const planRoute = this.state.planRoute;
                    const planRoutePolyline = this.state.planRoutePolyline;
                    this.setState({planRoute: [...planRoute, res], planRoutePolyline: [...planRoutePolyline, newPlanRoutePolyline],});
                    console.log(planRoutePolyline);
                })
                .catch(err => {
                    console.log('步行路径规划失败');
                });
        }

    }

    convertPlanRouteData2PolylineStr(res){
        return (res.route.paths[0].steps.map((step) => { return step.polyline})).join(";");
    }

    convertPolylineStr2ArrJSON(polylineStr:string){
        const arr0 = polylineStr.split(';');
        if(!arr0.length) return null;
        const len = arr0.length;
        let j = 0;
        let arr: any[][] = [];
        for(; j < len; ++j){
            arr.push(arr0[j].split(','));
        }
        let i = 0;
        let arrayJSON = [];
        for(; i < len; ++i){  // *1 convert string to num
            arrayJSON.push({"longitude":arr[i][0]*1,"latitude":arr[i][1]*1});
        }
        console.log(arrayJSON);  // arrayJSON 为所需
        return arrayJSON;
    }

    handleRecordFootprintBtnClicked(){
        const status = this.state.isRecordingFootprint;
        if(!status) {  // start footprint
            this.startRecordFootprint();
        } else {  // end footprint
            this.finishRecordFootprint();
        }
        this.setState({isRecordingFootprint: !status});
    }

    handlePlanRouteBtnClicked(){
        this.showPlanRouteActionSheet();
        this.setState({markersEditable: false});
    }


    handleClearPlanRouteBtnClicked(){
        this.setState({
            markers: [],
            planRoute: [],
            planRoutePolyline: [],
        });
    }

    handleMarkersModifyBtnClicked(){
        const status = this.state.markersEditable;
        if(!status) {alert("点击地图添加 Marker，点击 Marker 移除");}
        this.setState({markersEditable: !status});
    }



    handleMarkerModify(position: never){
        if(!this.state.markersEditable) return;
        const markers = this.state.markers;
        markers.splice(markers.indexOf(position), 1);
        this.setState({markers: [...markers]});
    }

    log(event: string, data: any) {
        console.log(data);
        if(event == "onLocation"){
            this.setState({
                location: data,
            });
        }
        this.setState({
            logs: [
                {
                    key: Date.now().toString(),
                    time: new Date().toLocaleString(),
                    event,
                    data: JSON.stringify(data, null, 2),
                },
                ...this.state.logs,
            ],
        });
    }

    logger(name: string) {
        return ({ nativeEvent }: NativeSyntheticEvent<any>) => this.log(name, nativeEvent);
    }

    renderItem = ({ item }: ListRenderItemInfo<any>) => (
        <Text style={style.logText}>
            {item.time} {item.event}: {item.data}
        </Text>
    );

    render() {
        const {markers, footprintData, planRoutePolyline, searchTipsText, mapType, imgs, photoMarkers, markersEditable, isRecordingFootprint} = this.state;
        console.log(footprintData);
        const events = ["onLoad", "onPress", "onPressPoi", "onLongPress", "onCameraIdle", "onLocation"];
        const buttonMarkersModifyText = markersEditable ? "完成标记" : "添加或删除标记";
        const buttonMarkersModifyIcon = markersEditable ? <IconMC name="map-marker-off" style={style.actionButtonIcon} /> : <IconMC name="map-marker-plus" style={style.actionButtonIcon} />;
        const buttonRecordFootprintText = isRecordingFootprint ? "结束足迹" : "开始足迹";
        return (
            <View style={style.body}>
                <SearchBar
                    ref={ref=>this.search = ref}
                    placeholder="搜索地点添加标记"
                    onChangeText={(newSearchText)=> {this.handleSearchTextChange(newSearchText)}}
                    onSearchButtonPress={()=> {this.handleSearchButtonPressed()}}
                />
                {searchTipsText
                    .map(a => (
                        <Text style={style.listItem} key={a} onPress={()=>{this.handleSearchTipClicked(a)}}>
                            {a}
                        </Text>
                    ))}
                <MapView
                    style={style.body}
                    {...Object.fromEntries(events.map((i) => [i, this.logger(i)]))}
                    distanceFilter={10}
                    headingFilter={90}
                    myLocationEnabled={true}
                    myLocationButtonEnabled={true}
                    mapType={mapType}
                    onPress={({ nativeEvent }) => {
                        this.search.unFocus();
                        if(this.state.markersEditable) this.setState({markers: [...markers, nativeEvent]});
                    }}
                >
                    <Polyline  // 记录的足迹
                        width={5}
                        color="rgba(255, 0, 0, 0.5)"
                        // onPress={() => alert("onPress")}
                        points={footprintData.map((position) => { return {latitude: position.coords.latitude, longitude: position.coords.longitude}})}
                        // gradient  // 渐变颜色
                    />
                    <Polyline  // 规划的路径
                        width={5}
                        points={planRoutePolyline}
                        color="rgba(40,113,62,1)"
                    />
                    {/*{planRoutePolyline.map((planRoute) => (*/}
                    {/*    <Polyline  // 规划的路径*/}
                    {/*        width={5}*/}
                    {/*        color="rgba(255, 0, 0, 0.5)"*/}
                    {/*        points={planRoute}*/}
                    {/*        // gradient  // 渐变颜色*/}
                    {/*    />*/}
                    {/*))}*/}
                    {markers.map((position) => (  // 路径规划的 marker
                        <Marker
                            key={`${position.latitude},${position.longitude}`}
                            icon={require("../images/flag.png")}
                            position={position}
                            onPress={() => {this.handleMarkerModify(position)}}
                        />
                    ))}
                    {photoMarkers.map((item, index) => {  // 拍照打卡的图片
                        return (
                            <View key={index}>
                                <Marker
                                    onPress={() => alert("onPress")}  // TODO: 查看足迹详情或图片详情，需要显示所有同一地点的图片吗？
                                    position={{ latitude: item.location.coords.latitude, longitude: item.location.coords.longitude }}
                                    icon={{
                                        uri: item.imgs[0].uri,
                                        width: 30,
                                        height: 30,
                                    }}
                                />
                                {/*<Image style={{width: 40, height: 40}} source={{uri: item.uri}} />*/}
                                {/*<Text>{item.fileName}</Text>*/}
                            </View>
                        );
                    })}
                </MapView>
                {/* Rest of the app comes ABOVE the action button component !*/}
                <ActionButton buttonColor="rgba(231,76,60,1)" position={'left'} offsetY={50}>
                    <ActionButton.Item buttonColor='#9e9e9e' title="地图设置" onPress={() => {this.showMapTypeActionSheet()}}>
                        <IconF5 name="map-marked-alt" style={style.actionButtonIcon} />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#f39800' title="我在哪里" onPress={() => {this.updateLocationOnce()}}>
                        <IconM name="not-listed-location" style={style.actionButtonIcon} />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="清除规划和标记点" onPress={() => {this.handleClearPlanRouteBtnClicked()}}>
                        <IconMC name="map-marker-remove" style={style.actionButtonIcon} />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#1abc9c' title="路径规划" onPress={() => {this.handlePlanRouteBtnClicked()}}>
                        <IconF5 name="route" style={style.actionButtonIcon} />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title={buttonMarkersModifyText} onPress={() => {this.handleMarkersModifyBtnClicked()}}>
                        {buttonMarkersModifyIcon}
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="拍照打卡" onPress={() => {this.showPhotoAlbumVideoActionSheet()}}>
                        <IconMC name="camera-marker" style={style.actionButtonIcon} />
                    </ActionButton.Item>
                </ActionButton>
                <ActionButton position={'center'} offsetY={40} size={85} renderIcon={()=>( isRecordingFootprint ? <IconMC name='pause' style={style.actionButtonBigIcon} /> : <IconMC name='foot-print' style={style.actionButtonBigIcon} />)} onPress={() => {this.handleRecordFootprintBtnClicked()}}>
                    {/*title={buttonRecordFootprintText}*/}
                </ActionButton>
                {/*<FlatList style={style.logs} data={this.state.logs} renderItem={this.renderItem} />*/}
                {/*<Picker*/}
                {/*    style={{ backgroundColor: "#fff" }}*/}
                {/*    selectedValue={mapType}*/}
                {/*    onValueChange={(itemValue, itemIndex) =>*/}
                {/*        this.setMapType(itemValue)}*/}
                {/*>*/}
                {/*    <Picker.Item label="标准" value={MapType.Standard} />*/}
                {/*    <Picker.Item label="卫星" value={MapType.Satellite} />*/}
                {/*    <Picker.Item label="导航" value={MapType.Navi} />*/}
                {/*    <Picker.Item label="夜间" value={MapType.Night} />*/}
                {/*    <Picker.Item label="公交" value={MapType.Bus} />*/}
                {/*</Picker>*/}
                <ActionSheet
                    ref={o => this.MapTypeActionSheet = o}
                    title={'地图种类'}
                    options={['标准', '卫星','导航','夜间', '公交', '取消']}
                    cancelButtonIndex={5}
                    destructiveButtonIndex={0}
                    onPress={(index) => { this.handleMapTypeActionSheetSelect(index)}}
                />
                <ActionSheet
                    ref={o => this.PlanRouteActionSheet = o}
                    title={'请选择您的出行方式'}
                    options={['驾车', '步行', '取消']}
                    cancelButtonIndex={2}
                    destructiveButtonIndex={0}
                    onPress={(index) => { this.handlePlanRouteActionSheetSelect(index)}}
                />
                <ActionSheet
                    ref={o => this.PhotoAlbumVideoActionSheet = o}
                    title={'请选择打卡方式'}
                    options={['打开相机', '从相册中选择', '选择视频', '取消']}
                    cancelButtonIndex={3}
                    destructiveButtonIndex={0}
                    onPress={(index) => { this.handlePhotoAlbumVideoSheetSelect(index)}}
                />
            </View>
        );
    }
};


const style = StyleSheet.create({
    body: { flex: 1 },
    logs: { elevation: 8, flex: 1 },
    logText: {
        fontFamily: Platform.OS === "ios" ? "menlo" : "monospace",
        fontSize: 12,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 10,
        paddingBottom: 10,
    },
    controls: {
        flexWrap: "wrap",
        alignItems: "flex-start",
        flexDirection: "row",
        marginBottom: 16,
    },
    result: {
        fontFamily: Platform.OS === "ios" ? "menlo" : "monospace",
    },
    listItem: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 18,
        backgroundColor: '#fff',
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },
    actionButtonBigIcon: {
        fontSize: 50,
        height: 53,
        color: 'white',
    },
});