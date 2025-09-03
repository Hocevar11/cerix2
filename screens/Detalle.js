import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Text as Rtext} from 'react-native';
import {Text, IconButton, Card, Divider } from 'react-native-paper';
import {useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';


export const DetallePedido  = () => {
    //Para recibir parametros
    const route = useRoute();
    const { item } = route.params;
  
    //Variables generales
    const [usuario, setUsuario] = useState('');
    const [detalle, setDetalle] = useState([]);
    const [loading, isLoading] = useState(false);
    const [host, selectedHost] = useState([]);
    const [mostrar, setMostrar] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('datosUsuario').then(res => {
            console.log(res);
            if(res){
                setUsuario(JSON.parse(res));
            }
        })
        
        AsyncStorage.getItem('host').then(res => {
            console.log(res);
            if(res){
                selectedHost(JSON.parse(res));
            }else{
                selectedHost([]);
            }
        })
    },[]);
    
    const url = host.protocolo + host.host + '/' + host.ruta + '/sincro/movil';    
    /*useEffect(() => {
        getDetalle(item.id);
    },[host])*/

    //Obtener el detalle del pedido (items)
    const getDetalle = async (id) => {
        isLoading(true);
        try{
            await axios.post(url+'/detallePedido', {pedido: id})
            .then(res => {
                if(res.data){
                    console.log(res.data);
                    setDetalle(res.data);

                    isLoading(false);
                }else{
                    console.log(res.data);
                    isLoading(false);
                }
            })
        }catch(e){
            console.log(e);
            isLoading(false);
        }
    }

    const renderDetalle = ({ item }) => {
        return (
            <View style={styles.cardContainer}>
              <Card style={styles.card} mode='contained'>
                <Card.Title
                  title={item.descrip}
                  titleNumberOfLines={2}
                  titleStyle = {{fontWeight:'600', fontSize:14, color:'#173f5f'}}
                />
                <Card.Content>
                    <View style = {{paddingVertical:0, flexDirection:'row', marginTop:-10}}>
                        <Text variant='bodyMedium' style={{fontSize:13, color: '#4d4d4d'}}>Precio: {item.preca} </Text>
                        <Text variant='bodyMedium' style={{fontSize:13, color: '#4d4d4d'}}>Total: {item.tota} </Text>
                        <Text variant='bodyMedium' style={{fontSize:13, color: '#4d4d4d'}}>Cant: {item.cana} </Text>
                    </View>
                </Card.Content>
              </Card>
              <Divider />
            </View>
        );
    }

    return(
        <View style = {{flex:1, backgroundColor:'#f0f5f9', padding:5}}>
            <View style = {styles.container}>
                <Rtext style = {{fontSize:21, color:'white', fontWeight:'600'}}>{item.nombre}</Rtext>
            </View>
            <View style = {styles.detailContainer}>

                <Card mode='elevated' style = {{backgroundColor:'#FFF', borderRadius:5}}>
                    <Card.Content>
                        <View style = {{alignItems:'center', marginBottom: 7}}>
                            <Rtext style = {{fontSize:19, fontWeight:'900', color: '#173f5f', marginTop:-3}}>Datos Generales</Rtext>
                        </View>

                        <View style = {styles.detailContent}>
                            <Text variant='bodyLarge' style = {{fontSize:15, color:'#4d4d4d'}}> Pedido</Text>
                            <Text variant='bodyLarge' style = {{fontSize:14, color:'#4d4d4d'}}> {item.pedido}</Text>
                        </View>
                        <View style = {styles.detailContent}>
                            <Text variant='bodyLarge' style = {{fontSize:15, color:'#4d4d4d'}}> Factura</Text>
                            {item.factura == null || item.factura == '' ? (
                                <Text variant='bodyLarge' style = {{fontSize:14, color:'red', fontWeight:'bold'}}> No facturado!</Text>
                            ):(
                                <Text variant='bodyLarge' style = {{fontSize:14, color:'#4d4d4d'}}> {item.factura}</Text>
                            )}
                        </View>
                        <View style = {styles.detailContent}>
                            <Text variant='bodyLarge' style = {{fontSize:15,color:'#4d4d4d'}}> Unidades</Text>
                            <Text variant='bodyLarge' style = {{fontSize:14,color:'#4d4d4d'}}> {item.cantidad}</Text>
                        </View>

                        <View style = {styles.detailContent}>
                            <Text variant='bodyLarge' style = {{fontSize:15,color:'#4d4d4d'}}> Fecha</Text>
                            <Text variant='bodyLarge' style = {{fontSize:14,color:'#4d4d4d'}}> {item.fecha}</Text>
                        </View>

                        <View style={styles.detailContent2}>
                            <View style={styles.column}>
                                <Text variant='bodyLarge' style={{ fontSize: 17, fontWeight: 'bold', color:'#173f5f' }}> Sub-Total</Text>
                                <Text variant='bodyLarge' style={{ fontSize: 15, textAlign: 'center', color:'#4d4d4d' }}> {item.totals}</Text>
                            </View>
                            <View style={styles.column}>
                                <Text variant='bodyLarge' style={{ fontSize: 17, fontWeight: 'bold', color:'#173f5f' }}>I.V.A</Text>
                                <Text variant='bodyLarge' style={{ fontSize: 15, textAlign: 'center', color:'#4d4d4d' }}> {item.iva}</Text>
                            </View>
                            <View style={styles.column}>
                                <Text variant='bodyLarge' style={{ fontSize: 17, fontWeight: 'bold', color:'#173f5f' }}> Total</Text>
                                <Text variant='bodyLarge' style={{ fontSize: 15, textAlign: 'center', color:'#4d4d4d' }}> {item.totalg}</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            </View>
            
            <View style = {{flexDirection:'row', alignItems:'center', padding:5, backgroundColor:'#fff', margin:15, marginBottom:5, borderTopLeftRadius:5, borderTopRightRadius:5}}>
                <IconButton  size = {25} iconColor='#173f5f' icon={require('../assets/icons/arrow-down.png')}  onPress={() => {
                    setMostrar(!mostrar); 
                    if(!mostrar && detalle == ''){
                        getDetalle(item.id);
                    }
                }} />
                <Rtext style = {{fontWeight:'900', fontSize:18, color:'#173f5f'}}>Lista de Productos</Rtext>
            </View>
            
            {mostrar && (
                <View style={styles.scrollContainer}>
                    <FlatList
                    data={detalle}
                    style = {{padding: 5}}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderDetalle}
                    />
                </View>

            )}

            <ReactNativeLoadingSpinnerOverlay visible={loading} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor:'#173f5f',
        padding:12,
        margin:15,
        borderRadius:5,
        elevation:5
    },

    detailContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    detailContent2: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },

    detailContainer: {
        padding: 5,
        margin: 10,
    },

    scrollContainer: {
        borderRadius: 5,
        paddingHorizontal:15,
        margin:15,
        marginTop:-7,
        flex:1,
        backgroundColor:'#fff'
    },

    column: {
        alignItems: 'center',
    },

    cardContainer: {
        marginBottom: 10,
    },

    card: {
        flex: 1,
        margin: 0,
        backgroundColor: '#FFF',
    },

    avatar: {
        backgroundColor: '#FFF',
        borderRadius: 10,
    
    },

    cardContent: {
        padding: 10,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },

    label: {
        fontWeight: 'bold',
        fontSize: 13,
    },
})

