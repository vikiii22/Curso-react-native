import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useAppContext } from "../context/AppContext";
import { IChannel } from '../interfaces/channels';
import axios from 'axios'

export const useChannels = () => {
    const { actionAddLists } = useAppContext()

    const initLoad = async() => {
        await loadLists()
    }

    const loadLists = async() => {
        try {
            const savedLists = await SecureStore.getItemAsync('lists')

            if (savedLists) {
                const data = JSON.parse(savedLists)

                if (data) {
                    Object.keys(data).forEach((listName) => {
                        actionAddLists(listName, data[listName])
                    })
                }
            }
        } catch (error) {
            console.error('Error al cargar la lista de canales:', error)
        }
    }

    const clearChannelList = async () => {
        try {
            await SecureStore.deleteItemAsync('lists')
            console.log('Lista de canales eliminada correctamente.')
        } catch (error) {
            console.error('Error al eliminar la lista de canales:', error)
        }
    }

    const saveChannelListToStore = async (listName: string, channels: IChannel[]) => {
        try {
          const storedLists = await SecureStore.getItemAsync('lists')
          const lists = storedLists ? JSON.parse(storedLists) : {}
      
          lists[listName] = channels

          await SecureStore.setItemAsync('lists', JSON.stringify(lists))
          console.log(`Lista "${listName}" guardada correctamente.`)
        } catch (error) {
          console.error('Error al guardar la lista de canales:', error)
        }
    }

    const handleLoadList = async (listName: string, m3u8Url: string) => {
        if (!listName || !m3u8Url) {
            Alert.alert('Error', 'Por favor, completa todos los campos.')
            return
        }
        
        try {
            const response = await axios.get(m3u8Url)
            const parsedChannels = parseM3U8(response.data)
            await saveChannelListToStore(listName, parsedChannels)
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar la lista m3u8.')
        }
    }

    const parseM3U8 = (data: any) => {
        const channels = [] 
        const lines = data.split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                const nameMatch = lines[i].match(/,(.*)/)
                const name = nameMatch ? nameMatch[1].trim() : 'Desconocido'
    
                const idMatch = lines[i].match(/id="(.*?)"/)
                const id = idMatch ? idMatch[1] : null
    
                const logoMatch = lines[i].match(/logo="(.*?)"/)
                const logo = logoMatch ? logoMatch[1] : null
    
                const groupMatch = lines[i].match(/title="(.*?)"/)
                const group = groupMatch ? groupMatch[1] : null
    
                const url = lines[i + 1] ? lines[i + 1].trim() : null

                if (url) {
                    channels.push({
                        name,
                        url,
                        id,
                        logo,
                        group
                    })
                }
            }
        }

        return channels
    }

    return {
        initLoad,
        clearChannelList,
        handleLoadList
    }
}