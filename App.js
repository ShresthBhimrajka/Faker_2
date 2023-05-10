import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Modal, Alert} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import * as FileSystem from 'expo-file-system';

const App = () => {
	const [video, setVideo] = useState([]);
	const [pred, setPred] = useState("");
	const [loading, setLoading] = useState(false); 
	const [selectedFrame, setSelectedFrame] = useState(null);
	const [pictureVisible, setPictureVisible] = useState(false);
	const [images, setImages] = useState([])

	const getFaces = async() => {
		let tempImages = [];
		let tempPred = "";
    try {
			uri = video[0].assets[0].uri;
			let fs_res = await FileSystem.getInfoAsync(uri);
			if(fs_res.size / 1000000 < 16.0) {
				setLoading(true);
				ind = uri.lastIndexOf("/");
				const name = uri.substring(ind + 1);
				ind = uri.lastIndexOf(".")
				const formData = new FormData();
				let headers = {
					Accept: 'application/json',
					'Content-Type': 'multipart/form-data',
				}
				let data = {
					name: name,
					type: video[0].assets[0].type + "/" + uri.substring(ind + 1),
					uri: uri
				}
				formData.append('file', data);
				const response = await axios({
					url: 'https://fakerbackend-la3iunu4ha-as.a.run.app/predict',
					method: 'POST',
					data: formData,
					headers: headers 
				});
				response.data.base64.forEach(b64 => tempImages.push(b64));
				tempPred = response.data["pred"];
				setPred(tempPred);
				setImages(tempImages);
				setLoading(false);
			}
			else {
				Alert.alert('File size larger than 16MB', 'Please pick a different file');
				reset();
			}
    } catch(err) {
      console.log(err);
			setLoading(false);
    }
  };

	const handleChooseVideo = async () => {
		let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }
      let pickerResult = await ImagePicker.launchImageLibraryAsync({
      	mediaTypes: ImagePicker.MediaTypeOptions.All,
				quality: 1
      });
      if (pickerResult.canceled === true) {
        return;
      }
      setVideo([...video, pickerResult]);
	};

	const runTest = () => {
		getFaces();
	};

	const reset = () => {
		setVideo([]);
		setPred("");
		setImages([]);
		setLoading(false);
	}

	const openPictureModal = (id) => {
		setPictureVisible(true);
		setSelectedFrame(id);
	}

	const closePictureModal = () => {
		setPictureVisible(false);
		setSelectedFrame(null);
	}

  return (
		<SafeAreaView style={{flex: 1}}>
      <LinearGradient
        colors={['rgba(51, 51, 153, 1)', 'rgba(51, 51, 153, 0.5)']}
        style={styles.container}>
        <View style={styles.elementContainer}>
          <Text style={styles.heading}>Welcome to Faker</Text>
          <Text style={styles.subHeading}>Upload a File to see if it's real</Text>
        </View>
				{video.length === 0 && (
					<TouchableOpacity style={styles.openButton} onPress={handleChooseVideo}>
						<Text style={styles.subHeading}>Upload</Text>
					</TouchableOpacity>
				)}
				{video.length !== 0 && (
					<View style={styles.listContainer}>
						<View style={styles.imageRow}>
							{video.map((image, index) => {
								return (
									<Image
										key={'key' + index}
										source={{
											uri: image.assets[0].uri,
										}}
										style={{
											width: '100%',
											marginVertical: '11%',
											height: '95%',
											resizeMode: 'contain',
										}}
									/>
								);
							})}
						</View>
						{loading ? (
							<Modal 
								visible={loading}
								transparent
								animationType='fade'>
								<View style={styles.optionsModalOuterContainer}>
									<View style={{...styles.optionsModalInnerContainer,alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 25}}>
										<LottieView
											autoPlay
											style={{
												width: 256,
												height: undefined,
												aspectRatio: 1,
												backgroundColor: 'rgba(54, 54, 128, 1)',
											}}
											source={require('./assets/16432-scan-face.json')}
										/>
										<Text style={styles.subHeading}>Predicting...</Text>
									</View>
								</View>
							</Modal>
						) : (
						<View style={styles.buttonContainer}>
							<TouchableOpacity style={{...styles.openButton, width: '40%'}} onPress={runTest}>
								<Text style={styles.subHeading}>Check</Text>
							</TouchableOpacity>
							<TouchableOpacity style={{...styles.openButton, width: '40%'}} onPress={reset}>
								<Text style={styles.subHeading}>Reset</Text>
							</TouchableOpacity>
						</View>)}
					</View>
				)}
				{!loading && images.length !== 0 && (
					<View style={styles.listContainer}>
						<ScrollView style={{flexDirection: 'row'}} horizontal={true}>
							{images.map((base64, ind) => {
								return (
									<View style={{flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4}} key={ind}>
										<TouchableOpacity onPress={() => openPictureModal(ind)}>
											<Image
												key={ind}
												source={{
													uri: `data:image/png;base64,${base64}`,
												}}
												style={{
													width: 128,
													height: 128,
													resizeMode: 'contain'
												}}
											/>
										</TouchableOpacity>
									</View>
								);
							})}
						</ScrollView>
					</View>
				)}
				{pred !== "" && !loading && (
					<View style={{}}>
						<Text style={styles.subHeading}>{video[0].assets[0].type.toUpperCase()} is {pred}% Real</Text>
					</View>
				)}
				<Modal 
					visible={pictureVisible} 
					transparent
					animationType='slide'>
					<View style={styles.optionsModalOuterContainer}>
						<TouchableOpacity
							style={styles.closeBtn}
							onPress={closePictureModal}>
								<Text style={styles.subHeading}>Close</Text>
						</TouchableOpacity>
						<View style={styles.optionsModalInnerContainer}>
							<View style={{alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(54, 54, 128, 1)',}}>
								<Image
									key={images[selectedFrame]}
									source={{
										uri: `data:image/png;base64,${images[selectedFrame]}`,
									}}
									style={{
										width: 256,
										height: 256,
										resizeMode: 'contain'
									}}
								/>
							</View>
						</View>
						<View style={{width: '80%',alignItems: 'center',paddingVertical: 5,backgroundColor: 'rgba(54, 54, 128, 1)',borderBottomRightRadius: 50,borderBottomLeftRadius: 50,}}>
							<Text style={styles.subHeading}> </Text>
						</View>
					</View>
				</Modal>
			</LinearGradient>
		</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},

	elementContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '95%',
		height: '20%',
		paddingBottom: '1%',
	},

  heading: {
		fontSize: 40,
		fontWeight: 'bold',
		textAlign: 'center',
		color: 'white',
	},

  subHeading: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		color: 'white',
	},

	openButton: {
		backgroundColor: '#80aaff',
		borderRadius: 10,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		width: '50%',
	},

	listContainer: {
		alignItems: 'center',
		justifyContent: 'space-evenly',
		height: '25%',
		width: '95%',
		margin: '1%',
	},

	imageRow: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '70%',
		margin: '1%',
	},

	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		width: '90%',
	},

	predBox: {
		alignItems: 'center',
		justifyContent: 'center',
		height: '10%',
		width: '90%',
		borderWidth: 1,
	},

	optionsModalOuterContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'center',
		alignItems: 'center',
  },

  optionsModalInnerContainer: {
    backgroundColor: 'rgba(54, 54, 128, 1)',
    width: '80%',
    maxHeight: '70%',
		padding: 10
  },

  closeBtn: {
		width: '80%',
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: 'rgba(54, 54, 128, 1)',
		borderTopRightRadius: 50,
		borderTopLeftRadius: 50,
  },
});

export default App;