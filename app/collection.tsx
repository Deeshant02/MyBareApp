import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Pressable, Platform, FlatList, ScrollView } from 'react-native';
import { goBack } from '../services/api/navigation-service';
import { getAsyncStorage, getCollectionsApi, getProfile, setAsyncStorage } from '../services/api/api-helper-service';
import Header from './shared-components/header';
import DateTimePicker from '@react-native-community/datetimepicker';
import Fontisto from '@react-native-vector-icons/fontisto';
import { getCollectinsTableData } from '../services/db/db-helper-service';
import dbServiceInstance from '../services/db/db-instance-service';
import DbService from '../services/db/db-instance-service';

class CollectionComponent extends Component {
    state = {
        date: new Date(),
        mode: 'date',
        show: false,
        collectionList: []
    };
    constructor(props: any) {
        super(props);
        this.state = {
            date: new Date(),
            mode: 'date',
            show: false,
            collectionList: []
        };
        this.getCollections();
    }

    async getCollections() {
        // const centerId = await getAsyncStorage('center_assigned');
        // let reqObj: any = {
        //     customer_info: true
        // };
        // reqObj.center = centerId;
        // reqObj.date = this.getServerDateFormat(new Date(this.state.date));
        // if (shift !== 'A') reqObj.shift = shift;
        // if (milkType !== 'A') reqObj.type = milkType;

        // getCollectionsApi(reqObj)
        // .then((response: any) => {
        //     this.setState({collectionList: response});
        // })
        // .catch((err) => {
        //     console.error(err);
        // });
        const dbService = DbService.getInstance(); // always same object
        await dbService.init(); // opens connection only once
        const dbConnection = dbService.getConnection();
        const collectionList = await getCollectinsTableData(dbConnection, true);
        console.log(collectionList);
        this.setState({collectionList: collectionList});
    }

    getServerDateFormat = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice();

        return `${year}-${month}-${day}`;
    };

    onChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate;
        this.setState({
            show: false,
            date: currentDate
        })
    };

    showMode = () => {
        this.setState({
            show: true,
        })
    };

    getUserDateFormat = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;
        return formattedDate;
    }

    Item = ({rowData}: any) => (
        <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
            <View style={{flexDirection: 'row'}}>
                <View style={{flexDirection: 'column'}}>
                    <Text>{this.state?.collectionList?.length && rowData?.item?.number}</Text>
                    <Text>{this.state?.collectionList?.length && (rowData?.item?.shift === 'M' ? '🌞' : '🌚')}</Text>
                </View>
                <View style={{flexDirection: 'column'}}>
                    <Text>{this.state?.collectionList?.length && rowData?.item?.name_en}</Text>
                    <Text>{this.state?.collectionList?.length && (rowData?.item?.type === 'C' ? '🐄' : '🐃') + '  FAT:' + rowData?.item?.fat + ' | SNF:' + rowData?.item?.snf}</Text>
                </View>
            </View>
            
            <View style={{flexDirection: 'row'}}>
                <View style={{flexDirection: 'column', alignItems: 'flex-end'}}>
                    <Text>{(rowData?.item?.quantity * rowData?.item?.rate) + '₹'}</Text>
                    <Text>{(rowData?.item?.quantity) + ' x ' + (rowData?.item?.rate)}kg</Text>
                </View>
            </View>
        </View>
    );

    render() {
        return (
            <>
                <Header title='Collections'></Header>
                <View style={styles.container}>
                    <View style={styles.dateColumn}>
                        <Pressable onPress={this.showMode}>
                            <View style={{flexDirection: 'row'}}>
                                <Fontisto name="calendar" color="black" size={15} />
                                <Text style={{paddingLeft: 5}}>{this.getUserDateFormat(this.state.date)}</Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={styles.btnsColumns}>
                        <View style={{flexDirection: 'row', gap: 10}}>
                            <Pressable onPress={this.showMode} style={{flex: 1}}>
                                <View style={styles.pressableBtns}>
                                    <Text>🌞</Text>
                                    <Text>Morning</Text>
                                </View>
                            </Pressable>
                            <Pressable onPress={this.showMode} style={{flex: 1}}>
                                <View style={styles.pressableBtns}>
                                    <Text>🌚</Text>
                                    <Text>Evening</Text>
                                </View>
                            </Pressable>
                        </View>

                        <View style={{flexDirection: 'row', gap: 10}}>
                            <Pressable onPress={this.showMode} style={{flex: 1}}>
                                <View style={styles.pressableBtns}>
                                    <Text>🐄</Text>
                                    <Text>Cow</Text>
                                </View>
                            </Pressable>
                            <Pressable onPress={this.showMode} style={{flex: 1}}>
                                <View style={styles.pressableBtns}>
                                    <Text>🐃</Text>
                                    <Text>Buffalo</Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                </View>
                <View>
                    <View style={styles.searchBarRow}>
                        <Text>Accepted: {this.state?.collectionList?.length}</Text>
                        <Fontisto name="zoom" color="black" size={15} />
                    </View>
                    <FlatList data={this.state?.collectionList}
                        renderItem={(item: any) => <this.Item rowData={item} 
                        keyExtractor={(item: any, index: any) => item.id?.toString() || index.toString()}/>}
                    />
                    {this.state.show && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={this.state.date}
                            mode={this.state.mode}
                            onChange={this.onChange}
                            />
                    )}
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 2
    },
    dateColumn: {
        flex: 1,
        paddingTop: 5,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    btnsColumns: {
        flex: 2,
        gap: 10,
    },
    pressableBtns: {
        flexDirection: 'row',
        padding: 5,
        borderWidth: 1,
        borderColor: 'grey',
        borderRadius: 5,
        gap: 10,
    },
    searchBarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
    }
});

export default CollectionComponent;