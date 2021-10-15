import React, {Component} from 'react';
import { List, Avatar, Button, Checkbox, Spin } from 'antd';
import satellite from "../assets/images/spacex_logo.svg";

class SatelliteList extends Component {
    constructor(){
        super();
        this.state = {
            selected: [], //selected 的卫星，初始化是空
        };
    }

    onChange = e => {
        const { dataInfo, checked } = e.target;
        const { selected } = this.state;
        const list = this.addOrRemove(dataInfo, checked, selected); //在list上增加或者 删除，根据checked 来看是添加还是删除， 自己写的
        this.setState({ selected: list })
    }

    addOrRemove = (item, status, list) => {
        // some 函数是什么？ -> some 里面为true就直接返回。
        const found = list.some( entry => entry.satid === item.satid);
        if(status && !found){
            list.push(item)
        }

        if(!status && found){
            //删除
            list = list.filter( entry => {
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    onShowSatMap = () =>{
        // 需要定义父级的时候传进来这个函数
        this.props.onShowMap(this.state.selected);
    }


    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : []; // ? 保证不是null， 是null 给空
        const { isLoad } = this.props;
        const { selected } = this.state;

        return (
             <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large"
                        disabled={ selected.length === 0}
                        onClick={this.onShowSatMap}
                >Track on the map</Button>
                <hr/>


                {
                    isLoad ?
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                        <List
                            className="sat-list"
                            itemLayout="horizontal"
                            size="small"
                            dataSource={satList}
                            renderItem={item => (
                                <List.Item
                                    // action 就是右边额外的功能， 和extra 类似， 里面放了个checkbox item
                                    // 定义一个onchange handler 
                                    // 调用 onChange 的时候会传一个e， e里面有什么去查表。
                                    // 为什么是e.target？ 看doc
                                    // dataInfo 就是item， 最后需要用到这个dataInfor， 他会存在e.target里面
                                    actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size={50} src={satellite} />}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date: ${item.launchDate}`}
                                    />

                                </List.Item>
                            )}
                        />
                }
            </div>
        );
    }
}

export default SatelliteList;
