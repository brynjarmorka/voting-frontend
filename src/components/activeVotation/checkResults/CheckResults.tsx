import React, { useContext, useEffect, useState } from 'react';
import { VStack, Flex } from '@chakra-ui/react';
import {
  Role,
  AlternativeResult,
  Alternative as AlternativeType,
  useReviewAddedSubscription,
  useGetReviewsQuery,
  ReviewResult,
} from '../../../__generated__/graphql-types';
import Loading from '../../common/Loading';
import { ActiveVotationContext } from '../../../pages/ActiveVotation';
import VotationReviews from './VotationReviews';
import ReviewVotation from './ReviewVotation';
import DownloadResultButton from '../DownloadResultButton';
import DisplayResults from './DisplayResults';
import { MeetingContext } from '../../../pages/MeetingLobby';

interface CheckResultsProps {
  meetingId: string;
  winners: AlternativeType[] | AlternativeResult[] | null;
  loading: boolean;
  castVotationReview: (approved: boolean) => void;
}

const CheckResults: React.FC<CheckResultsProps> = ({ meetingId, winners, loading, castVotationReview }) => {
  const { result, votationId, isStv } = useContext(ActiveVotationContext);
  const { role } = useContext(MeetingContext);
  const { data: reviewsResult } = useGetReviewsQuery({ variables: { votationId } });
  const [reviews, setReviews] = useState<ReviewResult>(reviewsResult?.getReviews || { approved: 0, disapproved: 0 });
  const [currentReview, setCurrentReview] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (reviewsResult?.getReviews) {
      setReviews(reviewsResult.getReviews);
    }
    const myReview =
      reviewsResult?.getMyReview?.__typename === 'VotationReview' ? reviewsResult.getMyReview.approved : undefined;
    setCurrentReview(myReview);
  }, [reviewsResult]);

  const { data: updatedReviewsResult } = useReviewAddedSubscription({ variables: { votationId } });
  useEffect(() => {
    if (updatedReviewsResult?.reviewAdded) {
      setReviews(updatedReviewsResult?.reviewAdded);
    }
  }, [updatedReviewsResult]);

  const handleCastReview = (approved: boolean) => {
    setCurrentReview(approved);
    castVotationReview(approved);
  };

  if (!result && loading) {
    return <Loading text="Henter resultater" />;
  }

  return (
    <VStack spacing="2rem">
      <DisplayResults result={result} isStv={isStv} votationId={votationId} />
      {(role === Role.Counter || role === Role.Admin) && (
        <VStack w="100%" spacing="2rem" alignItems="start">
          {role === Role.Admin && (
            <VotationReviews numberOfApproved={reviews.approved} numberOfDisapproved={reviews.disapproved} />
          )}
          <Flex justifyContent="space-between" w="100%" alignItems="flex-end" wrap="wrap">
            <ReviewVotation handleClick={handleCastReview} choice={currentReview} />
            {role === Role.Admin && result && <DownloadResultButton result={result} isStv={isStv} />}
          </Flex>
        </VStack>
      )}
    </VStack>
  );
};

export default CheckResults;
