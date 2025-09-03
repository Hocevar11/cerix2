import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, Provider } from 'react-native-paper';

const CustomAlert = ({ visible, hideDialog, title, message }) => {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={hideDialog} style = {styles.dialog}>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text style = {styles.message}>{message}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={hideDialog} style = {styles.button}>OK</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    )
}

const styles = StyleSheet.create({
    dialog: {
      borderRadius: 10,
      padding: 0,
      backgroundColor: '#f8f9fa',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    message: {
      fontSize: 16,
      color: '#555',
    },
    button: {
      marginRight: 10,
    },
});

export default CustomAlert;