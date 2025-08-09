import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Pressable } from 'react-native';
import { loginUser } from '../services/api/api-helper-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../services/api/navigation-service';

class MyClassComponent extends Component {
  state = { username: "", password: "" }

  constructor(props: any) {
    super(props);
    this.state = {
      username: '',
      password: ''
    };
  }

  handleChange = (field: any, value: any) => {
    this.setState({ [field]: value });
  };

  setAccessToken = async (access_token: string) => {
    try {
      await AsyncStorage.setItem('access_token', ('Token ' + access_token));
    } catch (error) {
      console.error('something went wrong while storing access token');
    }
  };

  logInUser = async () => {
    loginUser(this.state).then((data: any) => {
      console.log(data);
      this.setAccessToken(data?.token);
      navigate('Home', { userId: 123 });
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <View>
                <Image 
                    style={styles.mdLogo}
                    source={require('../assets/img/md_logo_web.png')}></Image>
            </View>
            <View>
                <Text style={styles.textPink}>Language</Text>
            </View>
        </View>
        <View style={styles.body}>
            <Text style={styles.logInText}>Login</Text>
            <View style={styles.card}>
                <View style={styles.cardContext}>
                    <View style={styles.mobileInput}>
                      <TextInput style={styles.mobileInputField}
                        placeholder="Mobile Number"
                        value={this.state.username}
                        onChangeText={(text) => this.handleChange('username', text)}
                      ></TextInput>
                    </View>
                    <View style={styles.passInput}>
                      <TextInput style={styles.passInputField}
                        placeholder="Password"
                        value={this.state.password}
                        onChangeText={(text) => this.handleChange('password', text)}
                      ></TextInput>
                    </View>
                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={styles.forgotPassText}>Forgot password?</Text>
                        </View>

                        <View>
                            <Pressable style={styles.logInBtn} onPress={this.logInUser}>
                                <Text style={styles.logInBtnText}>LOGIN</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>

            {/* <View>
              <View>
                <Text>Not registered yet?</Text>
              </View>
            </View> */}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  mdLogo: {
    width: 75,
    height: 25,
    resizeMode: 'contain',
  },
  textPink: {
    color: 'deeppink',
    fontWeight: '200'
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    // borderColor: 'red',
    // borderWidth: 2
  },
  logInText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#393185',
    paddingBottom: 20
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
  },
  cardContext: {
    padding: 15
  },
  mobileInput: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    paddingBottom: 20
  },
  mobileInputField: {
    fontSize: 16,
  },
  passInput: {
    paddingTop: 15
  },
  passInputField: {
    fontSize: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 25,
    // borderColor: 'red',
    // borderWidth: 2
  },
  forgotPassText: {
    color: '#3d8e83',
    fontSize: 12,
    fontWeight: 300
  },
  logInBtn: {
    backgroundColor: '#3d8e83',
    paddingHorizontal: 28,
    paddingVertical: 13 ,
  },
  logInBtnText: {
    fontSize: 12,
    color: 'white'
  }
});

export default MyClassComponent;
