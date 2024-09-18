import React, { useState, useEffect } from 'react';
import { Container, Title, Grid, Tabs, Skeleton, Image, Text } from '@mantine/core';
import useSWR from 'swr';
import axios from '@/utils/axiosInstance';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Product {
  id: number;
  title: string;
  description: string;
  image: string;
  reserved: number;
  category: string;
}

export function Products() {
  const [categories, setCategories] = useState<string[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<{ [key: string]: Product[] }>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data: productsData, error: productsError } = useSWR('getImages/', fetcher);
  const { data: categoriesData, error: categoriesError } = useSWR('getCategories/', fetcher);

  useEffect(() => {
    if (Array.isArray(categoriesData)) {
      setCategories(categoriesData);
      if (Array.isArray(productsData)) {
        const categorizedProducts: { [key: string]: Product[] } = {};

        productsData.forEach((product: Product) => {
          if (!categorizedProducts[product.category]) {
            categorizedProducts[product.category] = [];
          }
          categorizedProducts[product.category].push(product);
        });

        for (const category in categorizedProducts) {
          categorizedProducts[category].sort((a, b) => b.reserved - a.reserved);
        }

        setProductsByCategory(categorizedProducts);
        setActiveTab(categoriesData[0]); // Set the first category as the default active tab
      }
    }
  }, [productsData, categoriesData]);

  if (productsError || categoriesError) {
    return <div>Error loading data</div>;
  }

  if (!categories.length) {
    return <div>Loading categories...</div>;
  }

  return (
    <Container fluid pt={25} pb={50}>
      <Title pl={80} order={1} tt="uppercase">
        Most Used Laboratory Items
      </Title>

      <Tabs variant="pills" value={activeTab} onChange={setActiveTab}>
        <Tabs.List justify="center">
          {categories.map((category) => (
            <Tabs.Tab key={category} value={category}>
              {category}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {categories.map((category) => (
          <Tabs.Panel key={category} value={category}>
            <Container my="md">
              <div data-aos="fade-up">
                <Grid columns={24}>
                  {productsByCategory[category]?.length > 0 ? (
                    productsByCategory[category].slice(0, 5).map((product) => (
                      <Grid.Col key={product.id} span={{ base: 12, xs: 6 }}>
                        <Image src={product.image || '/fallback-image.png'} alt={product.title} />
                        <Title order={4}>{product.title}</Title>
                        <Text>{product.description}</Text>
                      </Grid.Col>
                    ))
                  ) : (
                    <Grid.Col span={24}>
                      <Skeleton height={140} radius="md" animate={false} />
                    </Grid.Col>
                  )}
                </Grid>
              </div>
            </Container>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Container>
  );
}
