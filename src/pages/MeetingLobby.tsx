import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Center, Box, Heading, Text, VStack, Divider } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useVotationOpenedForMeetingSubscription,
  useGetMeetingForLobbyQuery,
  Role,
  VotationStatus,
  useGetParticipantQuery,
  useParticipantUpdatedSubscription,
} from '../__generated__/graphql-types';
import Loading from '../components/common/Loading';
import VotationList from '../components/votationList/VotationList';
import ParticipantModal from '../components/manageParticipants/organisms/ParticipantModal';
import ReturnToPreviousButton from '../components/common/buttons/ReturnToPreviousButton';
import LobbyNavigation from '../components/meetingLobby/LobbyNavigation';
import PageContainer from '../components/common/layout/PageContainer';
import ActiveVotation from './ActiveVotation';
import { useAuth0 } from '@auth0/auth0-react';
import WrapStack from '../components/common/layout/WrapStack';
import SelfRegistration from '../components/meetingLobby/SelfRegistration';

export type MeetingContextState = {
  role: Role;
  meetingId: string;
  presentationMode: boolean;
  isVotingEligible: boolean;
  numberOfUpcomingVotations: number | null;
  allowSelfRegistration: boolean;
};

const contextDefualtValues: MeetingContextState = {
  role: Role.Participant,
  meetingId: '',
  presentationMode: false,
  isVotingEligible: false,
  numberOfUpcomingVotations: 0,
  allowSelfRegistration: false,
};

export enum MeetingLocation {
  LOBBY,
  ACTIVEVOTATION,
  SELFREGISTRATION,
}

export const MeetingContext = createContext<MeetingContextState>(contextDefualtValues);

const MeetingLobby: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth0();
  const { data, loading, error } = useGetMeetingForLobbyQuery({
    variables: {
      meetingId: meetingId ?? '',
    },
  });

  const [location, setLocation] = useState<MeetingLocation>(MeetingLocation.LOBBY);
  const [isVotingEligible, setIsVotingEligible] = useState(false);

  const [numberOfUpcomingVotations, setNumberOfUpcomingVotations] = useState<number | null>(null);

  const { data: participantResult, error: participantError } = useGetParticipantQuery({
    variables: { meetingId: meetingId ?? '' },
  });
  const [role, setRole] = useState<Role>();
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(false);
  const [openVotation, setOpenVotation] = useState<string | null>();
  // used to avoid immediately going back to open votation after going back to lobby
  const [lastOpenVotation, setLastOpenVotation] = useState<string | null>();
  const { data: votationOpened } = useVotationOpenedForMeetingSubscription({
    variables: {
      meetingId: meetingId ?? '',
    },
  });

  const { data: updatedParticipant } = useParticipantUpdatedSubscription({
    variables: {
      // remove auth0| from beginning of sub to get userId
      userId: user && user.sub ? user.sub.slice(6) : '',
      meetingId: meetingId ?? '',
    },
  });

  const navigate = useNavigate();

  const [presentationMode, setPresentationMode] = useState(false);

  useEffect(() => {
    if (!participantResult?.myParticipant) return;
    setRole(participantResult.myParticipant.role);
    setIsVotingEligible(participantResult.myParticipant.isVotingEligible);
  }, [participantResult]);

  useEffect(() => {
    if (!updatedParticipant?.participantUpdated) return;
    setRole(updatedParticipant.participantUpdated.role);
    setIsVotingEligible(updatedParticipant.participantUpdated.isVotingEligible);
  }, [updatedParticipant]);

  const navigateToOpenVotation = useCallback((openVotation: string | null) => {
    if (openVotation) setLocation(MeetingLocation.ACTIVEVOTATION);
  }, []);

  const handleOpenVotation = useCallback(
    (newOpenVotation: string) => {
      setLastOpenVotation(openVotation);
      setOpenVotation(newOpenVotation);
      setLocation(MeetingLocation.ACTIVEVOTATION);
    },
    [openVotation]
  );

  // handle votation being open initially
  useEffect(() => {
    if (!data?.getOpenVotation || openVotation !== undefined) return;
    handleOpenVotation(data.getOpenVotation);
  }, [data?.getOpenVotation, role, handleOpenVotation, openVotation]);

  // set initial number of upcoming votations
  useEffect(() => {
    if (!data?.numberOfUpcomingVotations || numberOfUpcomingVotations !== null) return;
    setNumberOfUpcomingVotations(data.numberOfUpcomingVotations);
  }, [data, numberOfUpcomingVotations]);

  useEffect(() => {
    if (!data?.meetingById || data?.meetingById?.allowSelfRegistration === allowSelfRegistration) return;
    setAllowSelfRegistration(data.meetingById.allowSelfRegistration);
  }, [data?.meetingById, allowSelfRegistration, setAllowSelfRegistration]);

  // handle votation opening
  useEffect(() => {
    if (
      !votationOpened?.votationOpenedForMeeting ||
      numberOfUpcomingVotations === null ||
      openVotation === votationOpened.votationOpenedForMeeting ||
      lastOpenVotation === votationOpened.votationOpenedForMeeting
    )
      return;
    setNumberOfUpcomingVotations(numberOfUpcomingVotations - 1);
    handleOpenVotation(votationOpened.votationOpenedForMeeting);
  }, [votationOpened, handleOpenVotation, numberOfUpcomingVotations, openVotation, lastOpenVotation]);

  const backToMyMeetings = () => {
    navigate('/', { replace: true });
  };

  const returnToVotationList = (status: VotationStatus) => {
    if (status !== VotationStatus.Open && status !== VotationStatus.CheckingResult) {
      setLastOpenVotation(openVotation);
      setOpenVotation(null);
    }
    setLocation(MeetingLocation.LOBBY);
  };

  if (loading) {
    return <Loading text={'Henter møte'} />;
  }

  if (error || participantError) {
    return (
      <Center mt="10vh">
        <Text>Det skjedde noe galt under innlastingen</Text>
      </Center>
    );
  }

  return (
    <MeetingContext.Provider
      value={{
        role: role ?? Role.Participant,
        meetingId: meetingId ?? '',
        presentationMode,
        isVotingEligible,
        numberOfUpcomingVotations,
        allowSelfRegistration,
      }}
    >
      <PageContainer>
        <Box color="gray.500" pb="2em" display="flex" flexDirection="column" alignItems="center">
          {role === Role.Admin && (
            <LobbyNavigation
              togglePresentationMode={() => setPresentationMode(!presentationMode)}
              openVotation={openVotation}
              location={location}
              setLocation={setLocation}
            />
          )}
          {location === MeetingLocation.ACTIVEVOTATION && openVotation ? (
            <ActiveVotation backToVotationList={returnToVotationList} votationId={openVotation} />
          ) : location === MeetingLocation.LOBBY ? (
            <VStack w="90vw" maxWidth="800px" alignItems="left" spacing="3em" mt="10vh">
              <VStack alignItems="left">
                <Heading size="lg">{data?.meetingById?.title}</Heading>
                <VStack align="start">
                  <Text mb="1.125em">Når en avstemning åpner, vil du bli tatt direkte til den.</Text>
                  <VotationList
                    setNumberOfUpcomingVotations={setNumberOfUpcomingVotations}
                    navigateToOpenVotation={navigateToOpenVotation}
                    role={role}
                    isMeetingLobby={true}
                    meetingId={meetingId ?? ''}
                  />
                </VStack>
              </VStack>
              <VStack alignItems="left" spacing="1em">
                <Divider />
                <WrapStack breakpoint={600} justifyContent="space-between">
                  <ReturnToPreviousButton onClick={backToMyMeetings} text="Tiltake til møteoversikt" />

                  {role === Role.Admin && (
                    <ParticipantModal meetingId={meetingId ?? ''} ownerEmail={data?.meetingById?.owner?.email} />
                  )}
                </WrapStack>
              </VStack>
            </VStack>
          ) : (
            <SelfRegistration meetingId={meetingId ?? ''} />
          )}
        </Box>
      </PageContainer>
    </MeetingContext.Provider>
  );
};

export default MeetingLobby;
