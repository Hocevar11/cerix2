import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme, FlatList, ScrollView} from 'react-native';
import { Button, Divider, FAB, IconButton, List, Modal, PaperProvider, Portal, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {NavigationContainer, useRoute, useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'

export const MainScreen = ({route, navigation}) => {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);

    const db = SQLite.openDatabase('sincronizar.db');

    useFocusEffect(
        React.useCallback(() => {
            guardarData();
        },[])
    )
      
    const guardarData = () => {
        db.transaction((tx) => {
          tx.executeSql('SELECT * FROM clientes', [], (_, { rows }) => {
            const datosClientes = rows._array;
            console.log(datosClientes);

            if(datosClientes.length > 0){
                setClientes(datosClientes);
                console.log('clientes agregados');
            }else{
                setClientes([]);
                console.log('No hay clientes que agregar');
            }            
          });
        });
    };

    const seleccionCli = async (cliente, nombre) => {
        try{            
            await AsyncStorage.setItem('cliente', JSON.stringify({ cliente, nombre }));
            Alert.alert('Exito','Cliente "' + nombre + '" seleccionado');
        }catch(error){
            Alert.alert('Error', 'Se ha producido un error '+error);
        }
      };
      
    const renderClientes = () => {
        const clientesFiltrados = clientes.filter((item) => 
            item.nombre.toLowerCase().includes(busqueda) ||
            item.cliente.toLowerCase().includes(busqueda) 
            
        );

        if(clientesFiltrados.length < 100){
            return clientesFiltrados.map((item) => {
                return(
                    <>
                    <List.Item 
                    key={item.id} 
                    title = {item.nombre}
                    description = {'RIF/CI '+item.rifci+' Saldo vencido: 0'}
                    left = {() => <List.Icon icon = 'account-tie-outline' />} 
                    right = {() => <List.Icon icon = 'information-outline' />}
                    onPress = {() => {seleccionCli(item.cliente, item.nombre)}} 
                    />
                    <Divider />
                    </>
                )
            })
        }else{
            return(
                <View>
                    <Text>Ingrese nombre o codigo en el buscador!</Text>
                </View>
            )
        }

    }

    return(
        <View style = {{flex:1}}>
            <View style = {{padding: 10}}>
                <TextInput
                 label='Buscar un Cliente...'
                 mode='flat'
                 value={busqueda}
                 onChangeText={setBusqueda}
                 left = {<TextInput.Icon icon = 'account-search' />}
                 />
                <ScrollView>
                    <List.Section>
                        <List.Subheader style = {{}}>Lista de Clientes</List.Subheader>
                        {renderClientes()}
                    </List.Section>
                </ScrollView>
            </View>
        </View>
    )
}