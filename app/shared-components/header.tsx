import Fontisto from "@react-native-vector-icons/fontisto";
import { useEffect, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { getAsyncStorage } from "../../services/api/api-helper-service";
import { goBack } from "../../services/api/navigation-service";

type HeaderProps = {
    title: string;
};

export default function Header(props: HeaderProps) {
    const [centerName, setCenterName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            let userData: any = await getAsyncStorage('user');
            userData = JSON.parse(userData);
            setCenterName(userData?.centers[0]?.name_en);
        };

        fetchUser();
    }, [])

    return (
        <>
            <View style={styles.header}>
                <View style={styles.leftSideHeader}>
                    <View>
                        <Pressable onPress={() => goBack()}>
                            <Fontisto name="arrow-left" color="white" size={15} />
                        </Pressable>
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{props?.title}</Text>
                        <Text style={styles.centerName}>{centerName}</Text>
                    </View>
                </View>
                <View>
                    <Fontisto name="plus-a" color="white" size={20} />
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: '#3d8e83',
        height: 60,
    },
    leftSideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleContainer: {
        paddingHorizontal: 35,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 400,
    },
    centerName: {
        color: 'white',
        fontSize: 12,
        fontWeight: 300,
    }
})