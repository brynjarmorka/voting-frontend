import React from 'react';
import { AddIcon } from '@chakra-ui/icons';
import { Button, Divider, HStack, VStack } from '@chakra-ui/react';
import { offwhite } from '../styles/colors';

interface VotationListButtonRowProps {
  handleAddNewVotation: () => void;
  saveIsDisabled: boolean;
  handleSave: () => void;
}

const VotationListButtonRow: React.FC<VotationListButtonRowProps> = ({
  handleAddNewVotation,
  saveIsDisabled,
  handleSave,
}) => {
  return (
    <VStack position="sticky" bottom="0" w="100%" spacing="0">
      <Divider />
      <HStack
        onClick={(e) => e.stopPropagation()}
        alignSelf="center"
        width="98vw"
        zIndex="1"
        justifyContent="center"
        bg={offwhite}
        paddingY="1rem"
      >
        <HStack maxWidth="800px" w="92%" justifyContent="space-between">
          <Button
            aria-label="Legg til votering"
            w={'200px'}
            icon={<AddIcon w={3} h={3} />}
            borderRadius={'16em'}
            onClick={handleAddNewVotation}
          >
            Legg til votering
          </Button>
          <Button
            disabled={saveIsDisabled}
            bg="gray.500"
            color="white"
            w={'200px'}
            borderRadius={'16em'}
            onClick={handleSave}
          >
            Lagre
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default VotationListButtonRow;
