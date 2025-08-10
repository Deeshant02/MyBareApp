import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { goBack } from '../services/api/navigation-service';
import { getAsyncStorage, getProfile, setAsyncStorage } from '../services/api/api-helper-service';
import Header from './shared-components/header';
import DateTimePicker from '@react-native-community/datetimepicker';
import Fontisto from '@react-native-vector-icons/fontisto';

class CollectionComponent extends Component {
    state = {
        date: new Date(),
        mode: 'date',
        show: false
    };
    constructor(props: any) {
        super(props);
        this.state = {
            date: new Date(),
            mode: 'date',
            show: false
        };
    }

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
            mode: 'date',
        })
    };

    getUserDateFormat = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;
        console.log(formattedDate);
        return formattedDate;
    }

    render() {
        return (
            <>
                <Header title='Collections'></Header>
                <View style={styles.container}>
                    <View style={styles.column}>
                        <Fontisto name="calendar" color="white" size={15} />
                        <Text>{this.getUserDateFormat(this.state.date)}</Text>
                    </View>
                    <View style={styles.column}><Text>Column 2</Text></View>
                    <View style={styles.column}><Text>Column 3</Text></View>
                </View>
                <View>
                    <Button onPress={this.showMode} title="Show date picker!" />
                    <Text>selected: {this.state.date.toLocaleString()}</Text>
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
    },
    column: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    }
});

export default CollectionComponent;