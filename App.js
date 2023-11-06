import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert} from 'react-native';
import { Button, PaperProvider, TextInput, Text, ActivityIndicator, MD2Colors, IconButton, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {NavigationContainer, useRoute, useFocusEffect, TabActions} from '@react-navigation/native';
import { Hosts } from './Hosts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainScreen } from './screens/Main';
import axios from 'axios';
import ReactNativeLoadingSpinnerOverlay from 'react-native-loading-spinner-overlay';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import  Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Sincronizar } from './screens/Sincronizar';
import { Inventario } from './screens/Inventario';
import { Pedido } from './screens/Pedido';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export function App({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [clave,   setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [nombre, setNombre] = useState('');

  const [selectedHost, setSelectedHost] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, isLoading] = useState(false);
  const [checked, setChecked] = useState(false);

 /* const RenderHost = () => {
    return host.map(item => (
      <Picker.Item key={item.id} label = {item.nombre} value = {item.nombre} />
    ));
  }*/

  const toggleMostrarClave = () => {
    setMostrarClave(!mostrarClave);
  }

  useFocusEffect(
    React.useCallback(() => {

      const verHost = async () => {

        try{
          const hostG = await AsyncStorage.getItem('host');
          if(hostG){
              setSelectedHost(JSON.parse(hostG));
              setUrl(JSON.parse(hostG).protocolo + JSON.parse(hostG).host + '/' + JSON.parse(hostG).ruta + '/c_movil/');
              console.log(hostG);

              const datosGuardados = await AsyncStorage.getItem('datosUsuario');
              if (datosGuardados) {
                const { clave, usuario } = JSON.parse(datosGuardados);
                setUsuario(usuario);
                setClave(clave);
                
                navigation.navigate('Main', { url: JSON.parse(hostG).protocolo + JSON.parse(hostG).host + '/' + JSON.parse(hostG).ruta + '/c_movil/', titulo: JSON.parse(hostG).nombre });
                
              }else{
                console.log('No hay datos guardados');
              }
          }


        }catch(error){
          console.log(error);
        }

        /*AsyncStorage.getItem('host')
          .then(res => {
            if (res) {
              setSelectedHost(JSON.parse(res));
              setUrl(JSON.parse(res).protocolo + JSON.parse(res).host + '/' + JSON.parse(res).ruta + '/c_movil/');
              console.log(res);
            } else {
              setSelectedHost([]);
            }
          });*/
      };
      verHost();
    },[])
  );

  useEffect(() => {
    setUrl(selectedHost.protocolo+selectedHost.host+'/'+selectedHost.ruta+'/c_movil/');
  },[selectedHost])


  const Login = async () => {
    if(selectedHost.nombre){
      if(usuario && clave){
        isLoading(true);
        try{
          await axios.post(url+'login', {user: usuario, pass: clave})
          .then(res => {
            if(res.data.success){
              navigation.navigate('Main', { url: url, titulo: selectedHost.nombre });
              
              AsyncStorage.setItem('nombre', res.data.nombre);

              if(checked){
                guardarDatosUsuario();
              }

              isLoading(false);
            }else{
              Alert.alert('Error', 'No se ha conseguido el usuario');
              isLoading(false);
            }
            
          })
        }catch (error){
          alert(error);
          console.lor(error);
          isLoading(false);
        }
        
      }else{
        alert('Ingrese datos validos');

      }
    }else{
      alert('No ha seleccionado ningun host');
    }
    
    
  }

  const guardarDatosUsuario = async () => {
    try {
      await AsyncStorage.setItem('datosUsuario', JSON.stringify({ usuario, clave }));
    } catch (error) {
      console.log('Error al guardar los datos del usuario:', error);
    }
  };

 /*const cargarDatosUsuario = async () => {
    try {

    } catch (error) {
      console.log('Error al cargar los datos del usuario:', error);
    }

  };*/



  return (
    <View style={styles.container}>
      <View style = {[styles.shadowContainer, {borderRadius: 5, paddingHorizontal:10, paddingVertical:5, marginTop: 130}]}>
          <Image 
           source = {require('./assets/proteo.png')}
           resizeMode = 'contain'
           style = {styles.logo}
          />
          

          <TextInput 
            mode='outlined'
            label="Usuario"
            style = {styles.input}
            value = {usuario}
            onChangeText = {setUsuario}
            left = {<TextInput.Icon icon = 'account-outline' />}
          />

          <TextInput 
            label="Clave"
            mode='outlined'
            style = {styles.input}
            value = {clave}
            onChangeText = {setClave} 
            secureTextEntry = {!mostrarClave}
            left = {<TextInput.Icon icon = 'lock-outline' />}
            right = {<TextInput.Icon icon={mostrarClave ? 'eye-off' : 'eye'} onPress = {() => toggleMostrarClave()} />}

          />
          <View style = {{flexDirection:'row', alignItems:'center'}}>
            <Checkbox
              status={checked?'checked':'unchecked'}
              onPress = {() => setChecked(!checked)}
              />
              <Text>Recuerdame</Text>
          </View>

          <View style = {{alignItems:'center', justifyContent:'center'}}>
            <Text>Conexion: {selectedHost.nombre}</Text>
          </View>
          

          <View style = {{flexDirection: 'column', marginBottom:10, padding: 5}}>
            <Button icon='account-check' mode='elevated' style={{marginBottom:15}} onPress = {() => Login()} compact = {true} textColor = 'black' buttonColor='#b0ffab' >
                 Iniciar Sesion
            </Button>
            <Button icon='server-plus' mode='elevated' onPress = {() => navigation.navigate('Hosts')} compact = {true} textColor = 'black' buttonColor='#abd2ff'>
                 Conexiones
            </Button>
          </View>
      </View>
      <ReactNativeLoadingSpinnerOverlay visible={loading} />
      <StatusBar style="auto" />
    </View>
  );
}

const Header = () => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      <Image
        style={{ width: 43, height: 43, marginLeft: 8}}
        source={require('./assets/proteo.png')}
      />
    </View>
  );
};

const Maintabs = ({route}) => {
  const {url, titulo} = route.params;

  return (
    <Tab.Navigator
      screenOptions={({navigation}) => ({ 
        headerTitle: titulo,
          headerStyle: {
            backgroundColor:'#225a87'
          },
          headerLeft:() => (<Header />),
          headerRight: () => (
            <IconButton
                icon='logout' size={28} iconColor = 'black'
                onPress={() => {
                    Alert.alert(
                        'Confirmacion',
                        'Desea salir de la aplicacion?',
                        [{ text: 'Cancelar', onPress:  () => console.log('Cancelado'), style: 'cancel'}, {text: 'Ok', 
                        onPress: () => {
                          navigation.navigate('Registro');
                          AsyncStorage.removeItem('datosUsuario');
                      } }]
                    )
                }}
                />
        )

    })}>
      <Tab.Screen
        name="Mains"
        options={{          
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Icon name='account-group' color={color} size={size} />
          ),
          tabBarHideOnKeyboard: true,
        }}
      >
          {() => <MainScreen url={url} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inventario"
        component={Inventario}
        options={{
          tabBarLabel: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <Icon name='basket-outline' color={color} size={size} />
          ),
          tabBarHideOnKeyboard: true,
        }}
      />
      <Tab.Screen
        name="Pedido"
        component={Pedido}
        options={{
          tabBarLabel: 'Pedido',
          tabBarIcon: ({ color, size }) => (
            <Icon name='cart-arrow-down' color={color} size={size} />
          ),
          tabBarHideOnKeyboard: true,
        }}
      />
      <Tab.Screen
        name="Sincronizar"
        options={{
          tabBarLabel: 'Sincronizar',
          tabBarIcon: ({ color, size }) => (
            <Icon name='sync' color={color} size={size} />
          ),
          tabBarHideOnKeyboard: true,
        }}
      >
        {() => <Sincronizar url={url} />}

      </Tab.Screen>
    </Tab.Navigator>
  );
};

const Principal = () => {
  return(
    <PaperProvider>
      <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name = 'Registro' component = {App} options = {{
              headerShown: false
            }}/>

            <Stack.Screen name = 'Hosts' component = {Hosts} options = {{
              
            }}/>
            <Stack.Screen name = 'Main' component = {Maintabs} 
            options = {{
              headerShown:false,
              headerStyle:{
                backgroundColor: '#5eccff',
              },
            }}/>

          </Stack.Navigator>
        </NavigationContainer>
    </PaperProvider>
  )
}

export default Principal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 10,
    
  },

  logo: {
    width: 350,
    height: 90,
    marginTop: 10,
    marginBottom: 10,
  },

  input: {
    marginVertical: 10,
    color: '#000',
    borderRadius: 5,
    width: '100%',
    
  },

  shadowContainer: {
    elevation: 3,
    shadowColor:'#52006A'
  }
});
