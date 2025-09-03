import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, Pressable, Platform, FlatList} from 'react-native';
import { Button, PaperProvider, TextInput, Text, ActivityIndicator, MD2Colors, IconButton, Checkbox, Card, Avatar, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import {NavigationContainer, useRoute, useFocusEffect, TabActions} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import  Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SQLite from 'expo-sqlite/legacy'
import DateTimePicker from '@react-native-community/datetimepicker';

export const Historial  = ({navigation}) => {
    const [usuario, setUsuario] = useState('');
    const [historial, setHistorial] = useState([]);
    const [host, selectedHost] = useState([]);
    const [loading, isLoading] = useState(false);
    //const [expandedCardId, setExpandedCardId] = useState(null);
    const [mostrar, setMostrar] = useState(false);

    //Para el date picker
    const [hdate, setHDate] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const [hdate2, setHDate2] = useState('');
    const [date2, setDate2] = useState(new Date());
    const [showPicker2, setShowPicker2] = useState(false);

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

    const mostrarPicker = () => {
      setShowPicker(!showPicker);
    }

    const mostrarPicker2 = () => {
      setShowPicker2(!showPicker2);
    }
    
    const onChange = ({type}, selectedDate) => {
      if(type == 'set'){
        const currentDate = selectedDate;
        setDate(currentDate);

        if(Platform.OS === 'android') {
          mostrarPicker();
          setHDate(currentDate.toLocaleDateString());
        }
      }else{
        mostrarPicker();
      }
    }

    const onChange2 = ({type}, selectedDate) => {
      if(type == 'set'){
        const currentDate = selectedDate;
        setDate2(currentDate);

        if(Platform.OS === 'android') {
          mostrarPicker2();
          setHDate2(currentDate.toLocaleDateString());
        }
      }else{
        mostrarPicker2();
      }
    }

    const enviarFecha = async () => {
      isLoading(true);
      //console.log(usuario);
      if(!hdate || !hdate2){
        alert('Seleccione una fecha');
        isLoading(false);
        return false;
      }else{
        let fdesde = new Date(date).toLocaleString('es-Es');
        let fhasta = new Date(date2).toLocaleString('es-Es');
        
        await axios.post(url+'/historial', {fdesde: fdesde, fhasta: fhasta,  user: usuario.usuario})
        .then(res => {
          if(res.data){
            //console.log(res.data);
            setMostrar(true);

            setHistorial(res.data);
            isLoading(false);
          }else{
            alert('No se encontraron datos');
            isLoading(false);
          }
        });
      }
    }
    const detallePedido = async (item) => {
      navigation.navigate('DetalleP', {item});
    }

    const renderHistorial = ({ item }) => {
      const fecha = new Date(item.fecha).toLocaleDateString();
      //const isExpanded = expandedCardId === item.pedido;
  
      return (
        <View style={styles.cardContainer}>
          <Card style={styles.card} mode='contained'>
            <Card.Title
              title={item.nombre}
              titleStyle = {{fontWeight:'bold', color: '#173f5f', fontSize:14}}
              subtitle={'Nro. ' + item.pedido+ ' Fecha: '+item.fecha}
              subtitleStyle= {{color: '#4d4d4d', fontSize:13, marginTop:-7}}
              left={(props) => <Avatar.Icon {...props} icon={require('../assets/icons/cart-check.png')} size={58} color='#173f5f' style={styles.avatar} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon={require('../assets/icons/arrow-top-right.png')}
                  size={29}
                  iconColor='#173f5f'
                  onPress={() => detallePedido(item)}
                />
              )}
            />
          </Card>
          
        </View>
      );
    };

    return (
      <View style = {{flex: 1, backgroundColor:'#f0f5f9', padding: 5}}>
        <View style = {{alignItems:'center', marginTop:8}}>
          {!mostrar && (
            <Text  style = {{fontSize:20, fontWeight:'bold', color:'#173f5f'}}>Seleccione una fecha para buscar</Text>
          )}
        </View>
        <View style = {{paddingHorizontal:15, paddingVertical: 5}}>

            {showPicker && (
              <DateTimePicker
                mode='date'
                display='calendar'
                value={date}
                onChange={onChange}
                locale='es-ES'
                dateFormat='year month day'
              />
            )}

            {showPicker2 && (
              <DateTimePicker
                mode='date'
                display='calendar'
                value={date2}
                onChange={onChange2}
                locale='es-ES'
                dateFormat='year month day'
              />
            )}

            {!mostrar && (
              <>
                <View style = {{paddingHorizontal:15}}>
                      <Pressable
                        onPress={mostrarPicker}
                      >
                        <TextInput
                          placeholder='Desde'
                          mode='flat'
                          value={hdate}
                          onChangeText={setHDate}
                          style = {{backgroundColor: '#fff', marginBottom:8}}
                          dense={true}
                          editable = {false}
                          underlineColor='transparent'
                          activeUnderlineColor='transparent'
                          left = {<TextInput.Icon icon = {require('../assets/icons/calendar.png')} size={30} color='#4d4d4d' onPress={mostrarPicker} />}
                        />
                      </Pressable>
                      
                      <Pressable
                        onPress={mostrarPicker2}
                      >
                        <TextInput
                          placeholder='Hasta'
                          mode='flat'
                          value={hdate2}
                          onChangeText={setHDate2}
                          style = {{backgroundColor: '#fff', fontSize:15}}
                          dense={true}
                          editable = {false}
                          underlineColor='transparent'
                          activeUnderlineColor='transparent'
                          left = {<TextInput.Icon icon = {require('../assets/icons/calendar.png')} size={30} color='#4d4d4d' onPress={mostrarPicker2} />}
                        />
                      </Pressable>
                </View>
                <View style = {{marginTop:10, paddingHorizontal:13}}>
                  <Button mode='contained' icon='table-search' buttonColor='#173f5f' onPress={enviarFecha} style = {{borderRadius:5}} labelStyle={{fontSize:16}}>Buscar</Button>
                </View>
              </>
            )}

            {mostrar && (
              <View style = {{marginTop: 0, flexDirection:'row', alignItems:'center'}}>
                <IconButton  size = {30} icon = {require('../assets/icons/calendar-search.png')} iconColor='#173f5f' onPress={() => {setMostrar(false); setHistorial([])}} />
                <Text variant='bodyLarge' style = {{fontWeight:'bold', fontSize:20, color:'#173f5f'}}>Historial de pedidos</Text>
              </View>
            )}
            
          </View>
          <View style={styles.scrollContainer}>
            <FlatList
              data={historial}
              style = {{padding: 5}}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHistorial}
              />
          </View>
          <ReactNativeLoadingSpinnerOverlay visible={loading} />
      </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    borderRadius: 10,
    padding:2, 
    flex:1
  },
  
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius:5
  },
  avatar: {
    backgroundColor:'#fff',
    left: -10
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
  value: {
    fontSize: 12,
  },
});