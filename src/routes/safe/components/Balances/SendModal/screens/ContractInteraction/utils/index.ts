import createDecorator from 'final-form-calculate'

import { mustBeEthereumAddress, mustBeEthereumContractAddress } from 'src/components/forms/validator'
import { getNetwork } from 'src/config'
import { getConfiguredSource } from 'src/logic/contractInteraction/sources'
import { getWeb3 } from 'src/logic/wallets/getWeb3'
import { TransactionReviewType } from '../Review'

export const NO_CONTRACT = 'no contract'

export const abiExtractor = createDecorator({
  field: 'contractAddress',
  updates: {
    abi: async (contractAddress) => {
      if (
        !contractAddress ||
        mustBeEthereumAddress(contractAddress) ||
        (await mustBeEthereumContractAddress(contractAddress))
      ) {
        return NO_CONTRACT
      }
      const network = getNetwork()
      const source = getConfiguredSource()
      return source.getContractABI(contractAddress, network)
    },
  },
})

export const formMutators = {
  setMax: (args, state, utils) => {
    utils.changeValue(state, 'value', () => args[0])
  },
  setContractAddress: (args, state, utils) => {
    utils.changeValue(state, 'contractAddress', () => args[0])
  },
  setSelectedMethod: (args, state, utils) => {
    const modified =
      state.lastFormState.values.selectedMethod && state.lastFormState.values.selectedMethod.name !== args[0].name

    if (modified) {
      utils.changeValue(state, 'callResults', () => '')
      utils.changeValue(state, 'value', () => '')
    }

    utils.changeValue(state, 'selectedMethod', () => args[0])
  },
  setCallResults: (args, state, utils) => {
    utils.changeValue(state, 'callResults', () => args[0])
  },
}

export const createTxObject = (method, contractAddress, values) => {
  const web3 = getWeb3()
  const contract: any = new web3.eth.Contract([method], web3.utils.toChecksumAddress(contractAddress))
  const { inputs, name } = method
  const args = inputs.map(({ type }, index) => {
      if (type === 'address') {
        return values[`methodInput-${name}_${index}_${type}`].toLowerCase()
      }
      return values[`methodInput-${name}_${index}_${type}`]
  })

  return contract.methods[name](...args)
}

export const getValueFromTxInputs = (key: string, type: string, tx: TransactionReviewType): string => {
  let value = tx[key]
  if (type === 'bool') {
    value = tx[key] ? String(tx[key]) : 'false'
  }
  if (type === 'address') {
    value = value.toLowerCase()
  }
  return value
}
