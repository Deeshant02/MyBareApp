import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { goBack, navigate } from '../services/api/navigation-service';
import { getAsyncStorage, getProfile, setAsyncStorage } from '../services/api/api-helper-service';

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
            code: ''
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
                code: ''
            }
        }
        if (isCallApi) {
            getProfile().then((data: any) => {
                setAsyncStorage('user', JSON.stringify(data));
                this.setState({ currCenter: data?.centers[0] });
                console.log(data);
            })
        }
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