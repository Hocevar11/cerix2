import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme} from 'react-native';
import { Button, FAB, IconButton, List, Modal, PaperProvider, Portal, TextInput } from 'react-native-paper';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import axios from 'axios';
import * as SQLite from  'expo-sqlite';



export const Sincronizar = ({url, navigation}) => {
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState('');
    const [loading, isLoading] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('nombre')
        .then(res => {
            if(res){
                setNombre(res);
                console.log(res);
            }
        })

        crearTablas();
    }, [])

    const db = SQLite.openDatabase('sincronizar.db');

    const crearTablas = () => {
        db.transaction((tx) => {
            //Crea la tabla de pedidos
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS pedido (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT, descrip TEXT, cana TEXT, preca DOUBLE, tota DOUBLE, precad DOUBLE, iva DOUBLE, cliente TEXT)',
                [],
                () => { 
                    console.log('Tabla de pedidos creada correctamente');
                },
                (error) => {
                    console.log('Error al crear tablas', error);
                }
            );

            //Crea tabla de clientes
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente TEXT, nombre TEXT, grupo TEXT, limite DOUBLE, dialimi INT, dire TEXT, ciudad1 TEXT, telefono TEXT, email TEXT, rifci TEXT)',
                [],
                () => {
                    console.log('Tabla de clientes creada correctamente');
                },
                (error) => {
                    console.log('Error al crear tablas', error);
                }
            );

            //Crea tabla de inventario
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS inventario (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT, descrip TEXT, tipo TEXT, prov1 TEXT, precio1 DOUBLE, precio2 DOUBLE, precio3 DOUBLE, precio4 DOUBLE, preciod1 DOUBLE, preciod2 DOUBLE, preciod3 DOUBLE, preciod4 DOUBLE, marca TEXT, iva DOUBLE, existen INT)',
                [],
                () => {
                    console.log('Tabla de inventario creada correctamente');
                },
                (error) => {
                    console.log('Error al crear tablas', error);
                }
            );
        });            
    }

    const descargarData = async () => {
        isLoading(true);
        try{
            const response = await axios.post(url+'clientes');
            const clientesData = response.data;
            db.transaction((tx) => {
                //Elimina los registros
                tx.executeSql('DELETE FROM clientes');


                //Inserta los nuevos registros en la tabla
                clientesData.forEach((cliente) => {
                    tx.executeSql(
                        'INSERT INTO clientes (cliente, nombre, grupo, limite, dialimi, dire, ciudad1, telefono, email, rifci) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [cliente.cliente, cliente.nombre, cliente.grupo, cliente.limite, cliente.dialimi, cliente.dire, cliente.ciudad1, cliente.telefono, cliente.email, cliente.rifci]
                    )
                });

            });

            const invresponse = await axios.post(url+'inventario');
            const inventarioData = invresponse.data;
            console.log(inventarioData);
            db.transaction((tx) => {
                //Elimina los registros
                tx.executeSql('DELETE FROM inventario');

                //Inserta los nuevos registros en la tabla
                inventarioData.forEach((inv) => {
                    tx.executeSql(
                        'INSERT INTO inventario (codigo, descrip, tipo, prov1, precio1, precio2, precio3, precio4, preciod1, preciod2, preciod3, preciod4, marca, iva, existen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [inv.codigo, inv.descrip, inv.tipo, inv.prov1, inv.precio1, inv.precio2, inv.precio3, inv.precio4, inv.preciod1, inv.preciod2, inv.preciod3, inv.preciod4, inv.marca, inv.iva, inv.existen]
                    )
                });

            });

            setFecha(new Date().toLocaleString('es-ES'));
            isLoading(false);
            alert('Datos de clientes e inventario ingresados correctamente');

        }catch(error){
            alert('Error al obtener los datos de la API:', error);
            isLoading(false);
        }
        
    }

    const eliminarData = async () => {
        isLoading(true);
        try{
            db.transaction((tx) => {
                tx.executeSql('DELETE FROM clientes');
                tx.executeSql('DELETE FROM inventario');
                tx.executeSql('DELETE FROM pedido');
                AsyncStorage.removeItem('cliente');
            })
            isLoading(false);
            Alert.alert('Atencion','Clientes e inventario eliminados');
        }catch(error){
            alert(error);
            isLoading(false);
        }
    }

    return(
        <View style = {{flex:1, paddingHorizontal: 10}}>
            <View style = {{alignItems:'center', marginBottom: 10}}>
                <Text variant='headlineSmall'>Sincronizacion de Data </Text>
            </View>

            <Text>Vendedor: {nombre}</Text>
            <Text>Ultima Sincronizacion: {fecha}</Text>

            <View style = {{flexDirection:'row', justifyContent: 'space-around'}}>
                <Button icon='arrow-collapse-down' mode='elevated' onPress={() => descargarData()} style = {{marginTop: 15}} buttonColor='#b0ffab' >
                    <Text>Traer Data</Text>
                </Button>

                <Button icon='trash-can-outline' buttonColor='#ff9696' mode='elevated' onPress={() => eliminarData()} style = {{marginTop: 15}} >
                    <Text>Eliminar Data</Text>
                </Button>
            </View>

            <ReactNativeLoadingSpinnerOverlay visible={loading} />
        </View>
    )
}