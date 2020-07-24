import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      api.get<Food>(`/foods/${routeParams.id}`).then(response => {
        const formatedFood = {
          ...response.data,
          formattedPrice: formatValue(response.data.price),
        } as Food;

        const ExtraFood = response.data.extras.map(
          eachExtra => ({ ...eachExtra, quantity: 0 } as Extra),
        );

        setFood(formatedFood);
        setExtras(ExtraFood);
        api.get(`/favorites/`).then(FavoriteResponse => {
          FavoriteResponse.data.map(eachFavorite => {
            eachFavorite.id === response.data.id
              ? setIsFavorite(true)
              : setIsFavorite(false);
          });
        });
      });
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extrasIncremented = extras.map(eachExtra =>
      id === eachExtra.id
        ? { ...eachExtra, quantity: eachExtra.quantity + 1 }
        : eachExtra,
    );

    setExtras(extrasIncremented);
  }

  function handleDecrementExtra(id: number): void {
    const extrasDecremented = extras.map(eachExtra => {
      if (eachExtra.id === id && eachExtra.quantity) {
        return { ...eachExtra, quantity: eachExtra.quantity - 1 } as Extra;
      }
      return eachExtra;
    });

    setExtras(extrasDecremented);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(Thefood => Thefood + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(Thefood => (Thefood > 1 ? Thefood - 1 : Thefood));
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      api.delete(`favorites/${food.id}`).then(response => {
        setIsFavorite(false);
      });
    }
    api.post(`favorites/`, { food }).then(response => {
      setIsFavorite(true);
    });
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const ExtrasPrice = extras.reduce((amount, extra) => {
      const ExtrasValue = extra.quantity * extra.value;
      return amount + ExtrasValue;
    }, 0);
    const TotalValue = foodQuantity * (food.price + ExtrasPrice);

    return formatValue(TotalValue);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const order = { ...food, extras } as Omit<Food, 'formattedPrice'>;
    const requestBody = { data: order };
    await api.post('orders', requestBody);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
