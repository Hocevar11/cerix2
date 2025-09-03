import React, { useEffect, useState } from 'react';
import {StyleSheet, View, TouchableOpacity, Alert, ScrollView, Animated} from 'react-native';
import {Divider, IconButton, List, Modal, Portal, TextInput } from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite/legacy'
import CustomAlert from '../resources/CustomAlert';


export const MainScreen = ({route, navigation}) => {
    
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    //const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [modalvisible, setModalVisible] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState([]);
    const [scale] = useState(new Animated.Value(1));

    //Relaciado con la alerta
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const db = SQLite.openDatabase('sincronizar.db');

    useFocusEffect(
        React.useCallback(() => {
            guardarData();
        },[])
    )

    useEffect(() => {
        guardarData();
    },[])

    useEffect(() => {
        console.log(clienteSeleccionado);
    },[clienteSeleccionado])


    //Para la animacion del boton 
    const efectospButton = (cliente) => {
        navigation.navigate('Efectos', {cliente: cliente.cliente, nombre: cliente.nombre});
        setModalVisible(false);
    };

    const handleHover = (event) => {
        if (event.type === 'mouseenter') {
            if (scale !== null && scale !== undefined) {
                Animated.spring(scale, {
                    toValue: 1.1,
                    useNativeDriver: true,
                }).start();
            }
        } else {
            if (scale !== null && scale !== undefined) {
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                }).start();
            }
        }
    };

    //Para manejar la alerta 
    const showAlert = (title, message) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertVisible(true);
      };
    
    const hideAlert = () => {
        setAlertVisible(false);
    };

    //Carga la data de los clientes
    const guardarData = () => {
        const executeQuery = (retryCount = 0) => {
          db.transaction((tx) => {
            tx.executeSql(
              'SELECT * FROM clientes',
              [],
              (_, { rows }) => {
                const datosClientes = rows._array;
                //console.log(datosClientes);
      
                if (datosClientes.length > 0) {
                  setClientes(datosClientes);
                  console.log('Clientes agregados');
                } else {
                  setClientes([]);
                  console.log('No hay clientes que agregar');
                }
              },
              (tx, error) => {
                console.error('Error al ejecutar la consulta SQL:', error);
      
                // Retry logic for "database is locked" error
                if (error.message.includes('database is locked') && retryCount < 5) {
                  console.log('Retrying query due to database lock...');
                  setTimeout(() => executeQuery(retryCount + 1), 1000);
                }
              }
            );
          });
        };
      
        executeQuery();
    };

    //Para vel el modal con la informacion del cliente
    const verModal = (item) => {
        setModalVisible(true);
        setClienteSeleccionado(item);
    }

    //Asigno el cliente seleccionado
    const seleccionCli = async (cliente, nombre) => {
        try{            
            await AsyncStorage.setItem('cliente', JSON.stringify({ cliente, nombre }));
            //Alert.alert('Exito','Cliente "' + nombre + '" seleccionado');
            showAlert('Exito', 'Cliente "' + nombre + '" seleccionado');
        }catch(error){
            showAlert('Error', 'Se ha producido un error '+error);
            
        }
    };

    //Renderiza la lista de clientes
    const renderClientes = () => {
        const clientesFiltrados = clientes.filter((item) => 
            item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.cliente.toLowerCase().includes(busqueda) 
            
        );

        if(clientesFiltrados.length < 100){
            return clientesFiltrados.map((item) => {
                return(
                    <View key={item.id}>
                        <List.Item 
                        key={item.id} 
                        title = {item.nombre}
                        titleStyle = {{ color: '#173f5f', fontWeight:'bold', fontSize: 14}}
                        description = {'R.I.F / C.I '+item.rifci+' Saldo vencido: '+item.vencido}
                        left = {() => <List.Icon icon ={require('../assets/icons/info.png')} />} 
                        onPress = {() => {seleccionCli(item.cliente, item.nombre)}}
                        onLongPress={() => verModal(item)}
                        descriptionStyle = {{color: item.vencido < 0 ? 'red': '#4d4d4d', fontSize: 12}}
                        style = {{backgroundColor:'#FFF', padding:10, borderRadius: 8, marginBottom:10, width:'97%'}}
                        />
                        
                    </View>
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
        <View style = {{flex:1, backgroundColor:'#f0f5f9', padding: 7}}>
            <Portal>
                <Modal visible = {modalvisible} onDismiss = {() => {setModalVisible(false);}} style = {{padding: 5}}>
                    <View style = {{padding:8}}>
                        <View style = {{padding: 17, backgroundColor: '#FFF', borderRadius: 8}}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text variant='labelLarge' style={{ textAlign: 'center', flex: 1, fontWeight:'900', color:'#173f5f', fontSize: 18}}>Ficha del cliente</Text>
                                <IconButton icon='close' onPress={() => setModalVisible(false)} iconColor='red' size={19} style={{ marginLeft: 'auto', marginTop: 0, marginBottom: 0}} />
                            </View>

                            <Divider />
                            
                            <View style = {{marginVertical:15, justifyContent: 'space-between', margin:5}}>
                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text style={{fontWeight: 'bold'}}>Cliente:</Text> ({clienteSeleccionado.rifci}) {clienteSeleccionado.nombre}
                                </Text>

                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Direccion:</Text> {clienteSeleccionado.dire}
                                </Text>

                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Telefono:</Text> {clienteSeleccionado.telefono}
                                </Text>

                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Correo:</Text> {clienteSeleccionado.email}
                                </Text>

                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Credito:</Text> {clienteSeleccionado.limite} ({clienteSeleccionado.dialimi})
                                </Text>

                                <Text variant='bodyMedium' style={{marginBottom: 5}}>
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Facturas:</Text> &nbsp;
                                    <Text variant='bodyMedium' style = {{color:'green'}}>{clienteSeleccionado.facts}</Text> &nbsp;
                                    <Text variant='bodyMedium' style = {{fontWeight:'bold'}}>Devoluciones:</Text> &nbsp;
                                    <Text variant='bodyMedium' style = {{color:'red'}}>{clienteSeleccionado.devo}</Text>&nbsp;
                                </Text>

                            </View>
                            
                            <View style = {{alignItems:'center', marginTop: 0, marginBottom: 13}}>                                  
                                <TouchableOpacity
                                style = {styles.button}
                                onPress={() => efectospButton(clienteSeleccionado)}
                                onPressIn={handleHover}
                                onPressOut={handleHover}>
                                    <Animated.View style={[styles.buttonContent, { transform: [{ scale: scale }] }]}>
                                        <Text style = {styles.buttonText}>Ir a Efectos Pendientes</Text>
                                    </Animated.View>

                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </Portal>
            <View style = {{padding: 10}}>
                <View style = {{flexDirection:'row', justifyContent:'flex-start'}}>
                    <TextInput
                    placeholder='Buscar Clientes...'
                    mode='flat'
                    value={busqueda}
                    dense={true}
                    style = {{backgroundColor: '#fff', elevation:5, width:'75%', marginRight: 20, borderRadius:5}}
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    cursorColor='black'
                    onChangeText={setBusqueda}
                    
                    />

                    <IconButton
                    icon={require('../assets/icons/search-client.png')}
                    size={24}
                    mode='contained'
                    style = {{borderRadius:5, margin:0, backgroundColor:'#173f5f', width:'17%', elevation:5}}
                    iconColor='white'
                    />

                </View>
                <ScrollView>
                    <List.Section style = {{marginTop:15}}>
                        {renderClientes()}
                    </List.Section>
                </ScrollView>
            </View>
            <CustomAlert
            visible={alertVisible}
            hideDialog={hideAlert}
            title={alertTitle}
            message={alertMessage}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#173f5f',
        paddingVertical: 9,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
});