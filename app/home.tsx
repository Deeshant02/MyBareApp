import React, { Component } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { goBack } from '../services/api/navigation-service';
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
                setAsyncStorage('user', 'data');
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
                        <View>
                            <View style={styles.appIcon}></View>
                            <Text>Collection</Text>
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
    appIcon: {
        backgroundColor: 'orange',
        height: 50,
        width: 50,
        borderRadius: 50
    }
});

export default HomeComponent;