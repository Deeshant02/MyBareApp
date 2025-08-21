import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { goBack, navigate } from '../services/api/navigation-service';
import { getAsyncStorage, getCollectionSync, getCustomerSync, getProfile, setAsyncStorage } from '../services/api/api-helper-service';
import dbServiceInstance from '../services/db/db-instance-service';
import { createCollectionsTable, createCustomersTable, getCollectinsTableData, getCustomersTableData, removeAllCollections, syncCollectionsData, syncCustomersData } from '../services/db/db-helper-service';
import DbService from '../services/db/db-instance-service';
class HomeComponent extends Component {
    state = {currCenter: {
            name_en: '',
            address: {
                village: "",
                taluka: " ",
                district: "",
                state: "",
                pincode: ""
            },
            code: '',
            id: -1
        }
    };
    constructor(props: any, isCallApi: boolean = true) {
        super(props);
        this.state = {
            currCenter: {
                name_en: '', 
                address: {
                    village: "",
                    taluka: " ",
                    district: "",
                    state: "",
                    pincode: ""
                },
                code: '',
                id: -1
            }
        }

        if (isCallApi || true) {
            this.syncDb();
        }
    }

    async syncDb() {
        getProfile().then(async (data: any) => {
            setAsyncStorage('user', JSON.stringify(data));
            this.setState({ currCenter: data?.centers[0] });
            setAsyncStorage('center_assigned', data?.centers[0]?.id?.toString());
            console.log(this.state?.currCenter?.id?.toString());

            // await dbServiceInstance.init(); // ensure DB is ready

            // const dbConnection = await dbServiceInstance.getDbConnectionInstance();
            // console.log(dbServiceInstance);
            const dbService = DbService.getInstance(); // always same object
            await dbService.init(); // opens connection only once
            const dbConnection = dbService.getConnection();

            console.log('DB is:', dbConnection);
            console.log('DB executeSql exists?', typeof dbConnection.executeSql);

            getCustomerSync(0).then(async (data: any) => {
                console.log(data);
                await createCustomersTable(dbConnection);

                const dbCustomersDataList = await getCustomersTableData(dbConnection);

                await syncCustomersData(dbConnection, dbCustomersDataList, data?.add);

                getCollectionSync(0).then(async (data: any) => {
                    await createCollectionsTable(dbConnection);

                    await removeAllCollections(dbConnection);

                    const dbCollectionsDataList = await getCollectinsTableData(dbConnection);

                    await syncCollectionsData(dbConnection, dbCollectionsDataList, data?.add);
                })
            })
        })

        // const today = new Date();  
        // today.setHours(0, 0, 0, 0); // set to 12 AM
        // const timestamp = today.getTime(); // milliseconds since Unix epoch
        // console.log(timestamp);
    }

    render() {
        return (
            <>
                <View style={styles.mainDiv}>
                    <View style={styles.header}>
                        <Text>Settings</Text>
                    </View>

                    <View style={styles.cardBottom}>
                        <View style={styles.centerInfoTemplate}>
                            <View>
                                <Text style={styles.centerNameText}>{this.state.currCenter?.name_en || 'Loading...'}</Text>
                            </View>

                            <View>
                                <Text style={styles.centerCodeText}>{`[${this.state.currCenter?.code}] ${this.state.currCenter?.address?.village}, ${this.state.currCenter?.address?.taluka}, ${this.state.currCenter?.address?.district}, ${this.state.currCenter?.address?.pincode}`}</Text>
                            </View>
                        </View>
                        <View style={styles.appIconContainer}>
                            <TouchableOpacity onPress={() => navigate('Collection')}>
                                <View style={styles.appIcon}></View>
                                <Text style={styles.appNameText}>Collection</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.appIconContainer}>
                            <TouchableOpacity onPress={() => navigate('Printer')}>
                                <View style={styles.appIcon}></View>
                                <Text style={styles.appNameText}>Printer</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.appIconContainer}>
                            <TouchableOpacity onPress={() => navigate('Screenshot')}>
                                <View style={styles.appIcon}></View>
                                <Text style={styles.appNameText}>Screenshot</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    mainDiv: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        padding: 10,
        height: 120,
    },
    cardBottom: {
        flex: 1,
        backgroundColor: 'white',
        borderTopEndRadius: 15,
        borderTopLeftRadius: 15,
        borderColor: 'red',
        borderWidth: 2
    },
    centerInfoTemplate: {
        flexDirection: 'column',
        alignItems: 'center'
    },
    centerNameText: {
        fontSize: 18,
        color: '#393185',
    },
    centerCodeText: {
        fontSize: 10,
        color: '#3d8e83'
    },
    appIconContainer: {
        paddingVertical: 30,
        paddingHorizontal: 30,
    },
    appIcon: {
        backgroundColor: 'white',
        borderRadius: 50,
        height: 60,
        width: 60,
        elevation: 5,
    },
    appNameText: {
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: 400,
        color: '#393185',
    },
});

export default HomeComponent;