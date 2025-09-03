import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme, FlatList, ScrollView, Animated, Text as Rtext} from 'react-native';
import { Button, Divider, FAB, IconButton, List, Modal, Portal, TextInput, MD3Colors } from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import { LineChart } from 'react-native-chart-kit';

export const EfectosP = ({navigation, route}) => {
    const { cliente, nombre } = route.params;
    const [loading, isLoading] = useState(false);
    const [host, selectedHost] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [ventasGrafico, setVentasGrafico] = useState([]);
    const [mostrarTodas, setMostrarTodas] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            setMostrarTodas(false);
        },[])
    );

    /*useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <IconButton icon="arrow-left-thin" iconColor='blue' size={25} onPress={() => navigation.goBack() }/>
            ),
        });
    },[navigation])*/
    
    useEffect(() => {
        AsyncStorage.getItem('host').then(res => {
            console.log(res);
            if(res){
                selectedHost(JSON.parse(res));
            }else{
                selectedHost([]);
            }
        })
    }, [])

    useEffect(() => {
        obtenerFacturas();
    },[host])

    const url = host.protocolo + host.host + '/' + host.ruta + '/sincro/movil';

    const dataLabels = ventasGrafico.map(item => item.fecha); // Obtener las fechas como etiquetas
    const dataValues = ventasGrafico.map(item => parseFloat(item.monto)); // Obtener los totales de ventas como valores


    const graphData = {
        labels: dataLabels,
        datasets: [
            {
                data: dataValues,
                label: 'My First dataset',
                fill: true,
                
                borderColor: MD3Colors.teal500,
                borderWidth: 2,
            },
        ],
    }
    const chartsConfig = {
        backgroundColor: '#f0f5f9', // Color blanco para el fondo
        backgroundGradientFrom: '#f0f5f9', // Color azul claro para el inicio del degradado
        backgroundGradientTo: '#f0f5f9', // Color blanco para el final del degradado
        decimalPlaces: 2, // Opcional, por defecto a 2 decimales
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color azul para las líneas y puntos
        labelColor: (opacity = 15) => `rgba(0, 0, 0, ${opacity})`, // Color azul para las etiquetas
      };
      
      
    const obtenerFacturas = async () => {
        isLoading(true);
        try{
            await axios.post(url+'/efectosP/'+cliente).then((res) => {
                if(res.data){
                    console.log(res.data);
                    setFacturas(res.data);
                    isLoading(false);
                }else{
                    isLoading(false);
                }
            })

            await axios.post(url+'/ventasGrafico/'+cliente).then((res) => {
                if(res.data){
                    console.log(res.data);
                    setVentasGrafico(res.data);
                    isLoading(false);
                }else{
                    isLoading(false);
                }
            })
        }catch(error){
            //alert(error);
            isLoading(false);
        }
    }

    const renderFacturas = () => {
        if(facturas != null){
            const facturasToShow = mostrarTodas ? facturas : facturas.slice(0, 3);
            return facturasToShow.map((factura, index) => {
                return (
                    <View key = {index} style = {{padding: 10, backgroundColor:'#fff', borderRadius: 5, marginVertical:5}}>

                            <View style = {{flexDirection:'row', marginBottom:10, justifyContent:'center'}}>
                                <Rtext style = {{fontSize:15, color:'#173f5f', fontWeight:'700'}}>Efecto ({factura.tipo_doc}) </Rtext>
                                <Rtext style = {{fontSize:15, color:'#173f5f', fontWeight:'700'}}>{factura.numero}</Rtext>
                            </View>

                            <View style = {{flexDirection:'row', justifyContent:'space-between', maxWidth:350, marginBottom:7}}>
                                <Text variant='labelMedium' style = {{fontSize:13, color:'#4d4d4d'}}>Fecha </Text>
                                <Text variant='bodySmall'   style = {{fontSize:13, color:'#4d4d4d'}}>{factura.fecha}</Text>
                                <Text variant='labelMedium' style = {{fontSize:13, color:'#4d4d4d'}}>Vence </Text>
                                <Text variant='bodySmall'   style = {{fontSize:13, color:'#4d4d4d'}}>{factura.fvence}</Text>
                            </View>

                            <View style = {styles.detalles}>
                                <Text variant='labelMedium' style = {{fontSize:13,   color:'#4d4d4d'}}>Dias Vencido </Text>
                                {factura.vence < 0 ? (
                                    <Text variant='bodySmall' style = {{fontSize:13, color:'red'}}>{factura.vence}</Text>
                                ):(
                                    <Text variant='bodySmall' style = {{fontSize:13, color:'#4d4d4d'}}>{factura.vence}</Text>
                                )}
                            </View>

                            <View style = {{flexDirection:'row',  marginBottom:10}}>
                                <Text variant='labelMedium' style = {{fontSize:13, color:'#4d4d4d'}}>Observacion </Text>
                                <Text variant='bodySmall' style = {{fontSize:13, marginLeft:5, color:'#4d4d4d'}}>{factura.observa1}</Text>
                            </View>

                            <View style = {{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                                <Text variant='labelMedium' style = {{fontSize:13}}>Total Bs. </Text>
                                <Text variant='bodySmall' style = {{fontSize:14}}>{factura.monto}</Text>
                                <Text variant='labelMedium' style = {{fontSize:13, color:'green'}}>Total $. </Text>
                                <Text variant='bodySmall' style = {{fontSize:14, color:'green'}}>{factura.montod}</Text>
                            </View>

                            <View style = {{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                                <Text variant='labelMedium' style = {{fontSize:13}}>Abonos Bs. </Text>
                                <Text variant='bodySmall' style = {{fontSize:14}}>{factura.abonos}</Text>
                                <Text variant='labelMedium' style = {{fontSize:13, color:'green'}}>Abonos $. </Text>
                                <Text variant='bodySmall' style = {{fontSize:14, color:'green'}}>{factura.abonosd}</Text>
                            </View>
                    </View>
                )
            })

        }else{
            return (
                <Text variant='titleSmall'>No hay facturas por cargar</Text>
            )
        }
    }

    return (
        <View style = {{flex: 1, backgroundColor:'#f0f5f9', padding: 6}}>
            <ScrollView>
                <View style = {{ justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row'}}>
                    <IconButton icon="arrow-left-thick" iconColor='#173f5f' size={25} onPress={() => navigation.goBack() }/>
                    <Rtext style = {{fontSize:19, fontWeight:'800', color:'#173f5f'}}>{nombre}</Rtext>
                </View>
                <View style = {styles.facturas}>
                    <View style = {{alignItems:'center', justifyContent:'center', padding:10, backgroundColor:'#fff', borderRadius:6, marginBottom:8}}>
                        <Text variant='bodySmall' style = {{fontSize:16, color:'#173f5f', fontWeight:'bold'}}>Efectos Por Pagar (30 dias) </Text>
                    </View>
                        {renderFacturas()}
                        {facturas.length > 3 && !mostrarTodas && (
                            <Button mode='text' textColor='#173f5f' onPress={() => setMostrarTodas(true)}>Mostrar todas ({facturas.length})</Button>
                        )}
                </View>
                <View style = {styles.graficos}>
                    <View style = {{alignItems:'center', justifyContent:'center', padding:10, backgroundColor:'#fff', borderRadius:6, marginBottom:15}}>
                        <Text variant='bodySmall' style = {{fontSize:16, color:'#173f5f', fontWeight:'bold'}}>Movimiento del Cliente </Text>
                    </View>
                    <LineChart data={graphData} width={360} height={240} chartConfig={chartsConfig} style={{borderRadius:16}} withShadow={false} withOuterLines={false} />
                </View>
            </ScrollView>

                <ReactNativeLoadingSpinnerOverlay visible={loading} />

        </View>
    )
}

const styles = StyleSheet.create({
    facturas: {
        padding: 1, 
        borderRadius:6, 
        marginVertical:10, 
        marginHorizontal:10, 
        borderWidth:0,
        
    },

    graficos: {
        padding: 1, 
        
        borderRadius:6, 
        marginVertical:10, 
        marginHorizontal:10,
        borderWidth:0,Alert
    },

    detalles: {
        flexDirection:'row', 
        justifyContent:'space-between', 
        maxWidth:160, 
        marginBottom:7
    }
})