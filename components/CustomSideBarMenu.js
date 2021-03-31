import React, { Component } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity} from 'react-native';
import { DrawerItems } from 'react-navigation-drawer';
import firebase from 'firebase';
import db from '../config';
import WelcomeScreen from '../screens/WelcomeScreen';
import {Avatar} from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker';

export default class CustomSideBarMenu extends React.Component {
    constructor(){
        super();
        this.state = {
            userId: firebase.auth().currentUser.email,
            image: '',
            name: ''
        }
    }

    getUserProfile = () => {
        db.collection("Users").where("emailID","==",this.state.userId)
        .onSnapshot(
            querySnapshot => {
                querySnapshot.forEach((doc)=>{
                    this.setState({
                        name: doc.data().firstName + " " + doc.data().lastName
                    })
                })
            }
        )
    }

    fetchImage = (imageName) => {var storageRef = firebase.storage().ref().child("user_profiles/"+imageName);storageRef.getDownloadURL().then((url)=>{this.setState({image: url})}).catch((error)=>{this.setState({image: '#'})})}

    uploadImage = async(uri, imageName) => {
        var response = await fetch(uri);
        var blob = await response.blob();
        var ref = firebase.storage().ref().child("user_profiles/"+imageName);

        return ref.put(blob)
        .then((response)=>{
            this.fetchImage(imageName)
        })
    }

    selectPicture = async() => { 
        const {cancelled, uri} = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4,3],
            quality: 1080      
        })

        if(!cancelled) {
            this.setState({
                image: uri
            })
            this.uploadImage(uri, this.state.userId);
        }
    }

    componentDidMount() {
        this.getUserProfile();
        this.fetchImage(this.state.userId);
    }

    render(){
        return(
            <View style={{flex: 1}}>
                <View style={{flex: 0.5, alignItems: 'center', backgroundColor: 'teal'}}>
                    <Avatar
                    rounded
                    source={{
                        uri: this.state.image
                    }}
                    size="medium"
                    onPress={()=>{this.selectPicture()}}
                    containerStyle={{
                        flex: 0.75,
                        width: "60%",
                        height: "40%",
                        marginLeft: 0,
                        marginTop: 30,
                        borderRadius: 40,
                    }}
                    showEditButton/>
                    <Text style={{fontWeight: '200', fontSize: 20, paddingTop: 20}}> {this.state.name} </Text>
                </View>
                <View style={styles.drawerItemContainer}>
                    <DrawerItems
                    {...this.props}/>
                </View>
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={()=>{this.props.navigation.navigate('WelcomeScreen')
                    firebase.auth().signOut()}}>
                        <Text style={styles.logoutText}> Log Out </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    drawerItemContainer: {
        flex: 0.8
    },
    logoutContainer: {
        flex: 0.2,
        justifyContent: 'flex-end',
        paddingBottom: 30
    },
    logoutButton: {
        height: 30,
        width: '100%',
        justifyContent: 'center',
        paddingBottom: -30,
        paddingLeft: 10
    },
    logoutText: {
        fontSize: 30,
        fontWeight: 'bold'
    }
})